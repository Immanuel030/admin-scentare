<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/api.php';
require_once __DIR__ . '/../../services/ActivityLogger.php';

try {
    $admin = require_admin();
    $db = database();
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET') {
        $status = (string) ($_GET['status'] ?? 'all');
        $allowed = ['all', 'pending', 'paid', 'failed', 'refunded'];
        if (!in_array($status, $allowed, true)) $status = 'all';
        $search = mb_substr(trim((string) ($_GET['search'] ?? '')), 0, 100);
        $where = ' WHERE 1 = 1';
        $params = [];
        if ($status !== 'all') { $where .= ' AND o.payment_status = :status'; $params['status'] = $status; }
        if ($search !== '') {
            $where .= ' AND (o.order_number LIKE :search_order OR o.full_name LIKE :search_name OR u.email LIKE :search_email OR o.payment_method LIKE :search_method)';
            $like = '%' . $search . '%';
            $params += ['search_order' => $like, 'search_name' => $like, 'search_email' => $like, 'search_method' => $like];
        }
        $query = $db->prepare("SELECT o.id, o.order_number, o.full_name AS customer, u.email AS customer_email, o.payment_method, o.payment_status, o.total, o.created_at FROM orders o LEFT JOIN users u ON u.id = o.user_id{$where} ORDER BY FIELD(o.payment_status, 'pending', 'failed', 'paid', 'refunded'), o.created_at DESC, o.id DESC LIMIT 250");
        $query->execute($params);
        $counts = [];
        foreach ($allowed as $filter) {
            $counts[$filter] = (int) $db->query($filter === 'all' ? 'SELECT COUNT(*) FROM orders' : "SELECT COUNT(*) FROM orders WHERE payment_status = " . $db->quote($filter))->fetchColumn();
        }
        $stats = $db->query("SELECT COALESCE(SUM(CASE WHEN payment_status = 'paid' AND created_at >= CURRENT_DATE THEN total ELSE 0 END), 0) AS verified_today, SUM(payment_status = 'pending') AS pending_count, SUM(payment_status = 'failed') AS failed_count, ROUND(100 * SUM(payment_method = 'cod') / NULLIF(COUNT(*), 0)) AS cod_share FROM orders")->fetch();
        respond(200, ['payments' => $query->fetchAll(), 'counts' => $counts, 'stats' => ['verified_today' => (float) ($stats['verified_today'] ?? 0), 'pending_count' => (int) ($stats['pending_count'] ?? 0), 'failed_count' => (int) ($stats['failed_count'] ?? 0), 'cod_share' => (int) ($stats['cod_share'] ?? 0)]]);
    }

    if ($method !== 'POST') respond(405, ['message' => 'Method not allowed.']);
    require_csrf();
    $input = json_decode(file_get_contents('php://input'), true);
    $id = filter_var($input['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    $action = (string) ($input['action'] ?? '');
    if (!$id || !in_array($action, ['verify', 'retry'], true)) respond(422, ['message' => 'Choose a valid payment action.']);

    $db->beginTransaction();
    $currentQuery = $db->prepare('SELECT order_number, payment_status FROM orders WHERE id = :id FOR UPDATE');
    $currentQuery->execute(['id' => $id]);
    $current = $currentQuery->fetch();
    if (!$current) { $db->rollBack(); respond(404, ['message' => 'Payment not found.']); }
    $expected = $action === 'verify' ? 'pending' : 'failed';
    if ($current['payment_status'] !== $expected) { $db->rollBack(); respond(422, ['message' => 'This payment has already changed. Refresh and try again.']); }
    $next = $action === 'verify' ? 'paid' : 'pending';
    $update = $db->prepare('UPDATE orders SET payment_status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :id');
    $update->execute(['status' => $next, 'id' => $id]);
    $db->commit();
    log_activity($admin, 'Payments', $action === 'verify' ? 'Verified payment' : 'Reopened failed payment', $current['order_number'] . ' payment marked ' . $next . '.');
    respond(200, ['message' => $action === 'verify' ? 'Payment verified.' : 'Payment reopened for verification.']);
} catch (PDOException $exception) {
    if (isset($db) && $db->inTransaction()) $db->rollBack();
    error_log('Scentare payments database error: ' . $exception->getMessage());
    respond(500, ['message' => 'Could not process the payment request.']);
} catch (Throwable $exception) {
    if (isset($db) && $db->inTransaction()) $db->rollBack();
    error_log('Scentare payments API error: ' . $exception->getMessage());
    respond(500, ['message' => 'Could not process the payment request.']);
}
