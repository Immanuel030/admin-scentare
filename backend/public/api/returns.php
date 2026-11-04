<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/api.php';
require_once __DIR__ . '/../../services/ActivityLogger.php';
require_once __DIR__ . '/../../services/AdminNotificationService.php';

try {
    $admin = require_admin();
    $db = database();
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET') {
        $status = (string) ($_GET['status'] ?? 'all');
        $allowed = ['all', 'pending', 'approved', 'refunded', 'rejected'];
        if (!in_array($status, $allowed, true)) $status = 'all';
        $search = mb_substr(trim((string) ($_GET['search'] ?? '')), 0, 100);
        $where = ' WHERE 1 = 1';
        $params = [];
        if ($status !== 'all') { $where .= ' AND i.status = :status'; $params['status'] = $status; }
        if ($search !== '') {
            $where .= ' AND (o.order_number LIKE :order_number OR u.name LIKE :customer_name OR i.description LIKE :description OR i.type LIKE :issue_type OR CAST(i.id AS CHAR) LIKE :issue_id)';
            $like = '%' . $search . '%';
            $params += ['order_number' => $like, 'customer_name' => $like, 'description' => $like, 'issue_type' => $like, 'issue_id' => $like];
        }
        $query = $db->prepare("SELECT i.id, i.order_id, i.order_item_id, i.user_id, i.type, i.description, i.photo_path, i.status, i.admin_note, i.created_at, i.updated_at, o.order_number, u.name AS customer, COALESCE(oi.subtotal, o.total) AS amount, oi.product_name FROM order_issues i INNER JOIN orders o ON o.id = i.order_id INNER JOIN users u ON u.id = i.user_id LEFT JOIN order_items oi ON oi.id = i.order_item_id{$where} ORDER BY FIELD(i.status, 'pending', 'approved', 'refunded', 'rejected'), i.created_at DESC, i.id DESC LIMIT 300");
        $query->execute($params);
        $counts = [];
        foreach ($allowed as $filter) {
            $counts[$filter] = (int) $db->query($filter === 'all' ? 'SELECT COUNT(*) FROM order_issues' : 'SELECT COUNT(*) FROM order_issues WHERE status = ' . $db->quote($filter))->fetchColumn();
        }
        $stats = $db->query("SELECT SUM(i.status = 'pending') AS open_count, SUM(i.status IN ('approved', 'refunded') AND i.updated_at >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')) AS approved_month, COALESCE(SUM(CASE WHEN i.status = 'refunded' THEN COALESCE(oi.subtotal, o.total) ELSE 0 END), 0) AS refunded_amount, AVG(CASE WHEN i.status IN ('approved', 'refunded', 'rejected') THEN TIMESTAMPDIFF(SECOND, i.created_at, i.updated_at) / 86400 END) AS avg_resolution_days FROM order_issues i INNER JOIN orders o ON o.id = i.order_id LEFT JOIN order_items oi ON oi.id = i.order_item_id")->fetch();
        respond(200, ['requests' => $query->fetchAll(), 'counts' => $counts, 'stats' => ['open_count' => (int) ($stats['open_count'] ?? 0), 'approved_month' => (int) ($stats['approved_month'] ?? 0), 'refunded_amount' => (float) ($stats['refunded_amount'] ?? 0), 'avg_resolution_days' => (float) ($stats['avg_resolution_days'] ?? 0)]]);
    }

    if ($method !== 'POST') respond(405, ['message' => 'Method not allowed.']);
    require_csrf();
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) respond(400, ['message' => 'Invalid request body.']);
    $id = filter_var($input['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    $action = (string) ($input['action'] ?? '');
    if (!$id || !in_array($action, ['approve', 'reject', 'refund'], true)) respond(422, ['message' => 'Choose a valid return action.']);

    $db->beginTransaction();
    $issueQuery = $db->prepare('SELECT i.status, i.order_id, i.user_id, o.order_number, o.payment_status FROM order_issues i INNER JOIN orders o ON o.id = i.order_id WHERE i.id = :id FOR UPDATE');
    $issueQuery->execute(['id' => $id]);
    $issue = $issueQuery->fetch();
    if (!$issue) { $db->rollBack(); respond(404, ['message' => 'Return request not found.']); }
    $valid = match ($action) {
        'approve', 'reject' => $issue['status'] === 'pending',
        'refund' => in_array($issue['status'], ['pending', 'approved'], true),
    };
    if (!$valid) { $db->rollBack(); respond(422, ['message' => 'This request has already been resolved. Refresh and try again.']); }
    if ($action === 'refund' && $issue['payment_status'] !== 'paid') {
        $db->rollBack();
        respond(422, ['message' => 'This order was never marked paid, so there is nothing to refund.']);
    }
    $nextStatus = ['approve' => 'approved', 'reject' => 'rejected', 'refund' => 'refunded'][$action];
    $update = $db->prepare('UPDATE order_issues SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :id');
    $update->execute(['status' => $nextStatus, 'id' => $id]);
    if ($action === 'refund') {
        $orderUpdate = $db->prepare("UPDATE orders SET payment_status = 'refunded', updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT order_id FROM order_issues WHERE id = :id)");
        $orderUpdate->execute(['id' => $id]);
    }
    $db->commit();

    $messages = [
        'approve' => 'Your return/refund request for order ' . $issue['order_number'] . ' was approved.',
        'reject' => 'Your return/refund request for order ' . $issue['order_number'] . ' was not approved.',
        'refund' => 'Your refund for order ' . $issue['order_number'] . ' has been processed.',
    ];
    create_customer_notification($db, (int) $issue['user_id'], 'App\\Notifications\\OrderIssueUpdated', [
        'order_id' => (int) $issue['order_id'],
        'order_number' => $issue['order_number'],
        'status' => $nextStatus,
        'message' => $messages[$action],
    ]);

    $labels = ['approve' => 'Approved return request', 'reject' => 'Rejected return request', 'refund' => 'Recorded refund'];
    log_activity($admin, 'Returns & Refunds', $labels[$action], 'Request #' . $id . ' for order ' . $issue['order_number'] . ' marked ' . $nextStatus . '.');
    respond(200, ['message' => 'Return request updated.']);
} catch (PDOException $exception) {
    if (isset($db) && $db->inTransaction()) $db->rollBack();
    error_log('Scentare returns database error: ' . $exception->getMessage());
    respond(500, ['message' => 'Could not process the returns request.']);
} catch (Throwable $exception) {
    if (isset($db) && $db->inTransaction()) $db->rollBack();
    error_log('Scentare returns API error: ' . $exception->getMessage());
    respond(500, ['message' => 'Could not process the returns request.']);
}
