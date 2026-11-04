<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/api.php';
require_once __DIR__ . '/../../services/ActivityLogger.php';

try {
    $admin = require_admin();
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET') {
        $db = database();
        $page = max(1, (int) ($_GET['page'] ?? 1));
        $perPage = 10;
        $status = (string) ($_GET['status'] ?? 'all');
        $allowedStatuses = ['all', 'pending', 'published', 'flagged'];
        if (!in_array($status, $allowedStatuses, true)) {
            $status = 'all';
        }
        $search = mb_substr(trim((string) ($_GET['search'] ?? '')), 0, 100);
        $statusCondition = $status === 'all' ? " AND r.moderation_status <> 'removed'" : ' AND r.moderation_status = :status';
        $searchCondition = $search !== '' ? ' AND (u.name LIKE :customer_name OR u.email LIKE :customer_email OR p.name LIKE :product_name OR r.comment LIKE :comment)' : '';
        $from = ' FROM reviews r INNER JOIN users u ON u.id = r.user_id INNER JOIN products p ON p.id = r.product_id WHERE 1 = 1' . $statusCondition . $searchCondition;
        $count = $db->prepare('SELECT COUNT(*)' . $from);
        if ($status !== 'all') {
            $count->bindValue(':status', $status, PDO::PARAM_STR);
        }
        if ($search !== '') {
            $like = '%' . $search . '%';
            $count->bindValue(':customer_name', $like, PDO::PARAM_STR);
            $count->bindValue(':customer_email', $like, PDO::PARAM_STR);
            $count->bindValue(':product_name', $like, PDO::PARAM_STR);
            $count->bindValue(':comment', $like, PDO::PARAM_STR);
        }
        $count->execute();
        $total = (int) $count->fetchColumn();
        $pageCount = max(1, (int) ceil($total / $perPage));
        $page = min($page, $pageCount);

        $query = $db->prepare(<<<'SQL'
            SELECT r.id, r.rating, r.comment, r.moderation_status, r.created_at, r.updated_at,
                   u.name AS customer_name, u.email AS customer_email,
                   p.name AS product_name
            FROM reviews r
            INNER JOIN users u ON u.id = r.user_id
            INNER JOIN products p ON p.id = r.product_id
            WHERE 1 = 1
        SQL . $statusCondition . ($search !== '' ? ' AND (u.name LIKE :customer_name OR u.email LIKE :customer_email OR p.name LIKE :product_name OR r.comment LIKE :comment)' : '') . "
            ORDER BY CASE r.moderation_status WHEN 'pending' THEN 0 WHEN 'flagged' THEN 1 WHEN 'published' THEN 2 ELSE 3 END,
                     r.created_at DESC, r.id DESC
            LIMIT :limit OFFSET :offset");
        if ($status !== 'all') {
            $query->bindValue(':status', $status, PDO::PARAM_STR);
        }
        if ($search !== '') {
            $like = '%' . $search . '%';
            $query->bindValue(':customer_name', $like, PDO::PARAM_STR);
            $query->bindValue(':customer_email', $like, PDO::PARAM_STR);
            $query->bindValue(':product_name', $like, PDO::PARAM_STR);
            $query->bindValue(':comment', $like, PDO::PARAM_STR);
        }
        $query->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $query->bindValue(':offset', ($page - 1) * $perPage, PDO::PARAM_INT);
        $query->execute();

        $stats = $db->query(<<<'SQL'
            SELECT COALESCE(AVG(CASE WHEN moderation_status = 'published' THEN rating END), 0) AS average_rating,
                   SUM(moderation_status = 'pending') AS pending_count,
                   SUM(moderation_status = 'flagged') AS flagged_count,
                   SUM(moderation_status = 'published' AND created_at >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')) AS published_this_month
            FROM reviews
            WHERE moderation_status <> 'removed'
        SQL)->fetch();
        $counts = [];
        foreach ($allowedStatuses as $filter) {
            $condition = $filter === 'all' ? "moderation_status <> 'removed'" : 'moderation_status = ' . $db->quote($filter);
            $counts[$filter] = (int) $db->query('SELECT COUNT(*) FROM reviews WHERE ' . $condition)->fetchColumn();
        }
        respond(200, [
            'reviews' => $query->fetchAll(),
            'total' => $total,
            'page' => $page,
            'perPage' => $perPage,
            'pageCount' => $pageCount,
            'counts' => $counts,
            'stats' => [
                'average_rating' => round((float) ($stats['average_rating'] ?? 0), 1),
                'pending_count' => (int) ($stats['pending_count'] ?? 0),
                'flagged_count' => (int) ($stats['flagged_count'] ?? 0),
                'published_this_month' => (int) ($stats['published_this_month'] ?? 0),
            ],
        ]);
    }

    if ($method !== 'POST') {
        respond(405, ['message' => 'Method not allowed.']);
    }
    require_csrf();
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        respond(400, ['message' => 'Invalid request body.']);
    }
    $id = filter_var($input['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    $action = (string) ($input['action'] ?? '');
    $nextStatus = match ($action) {
        'approve', 'publish' => 'published',
        'flag' => 'flagged',
        'remove' => 'removed',
        default => '',
    };
    if (!$id || $nextStatus === '') {
        respond(422, ['message' => 'Invalid review moderation request.']);
    }

    $db = database();
    $db->beginTransaction();
    $reviewQuery = $db->prepare(<<<'SQL'
        SELECT r.moderation_status, r.comment, u.name AS customer_name, p.name AS product_name
        FROM reviews r
        INNER JOIN users u ON u.id = r.user_id
        INNER JOIN products p ON p.id = r.product_id
        WHERE r.id = :id
        FOR UPDATE
    SQL);
    $reviewQuery->execute(['id' => $id]);
    $review = $reviewQuery->fetch();
    if (!$review) {
        $db->rollBack();
        respond(404, ['message' => 'Review not found.']);
    }
    $validActions = [
        'pending' => ['approve', 'flag', 'remove'],
        'published' => ['flag', 'remove'],
        'flagged' => ['publish', 'remove'],
        'removed' => [],
    ];
    if (!in_array($action, $validActions[$review['moderation_status']] ?? [], true)) {
        $db->rollBack();
        respond(422, ['message' => 'That moderation action is not allowed for this review.']);
    }

    $update = $db->prepare('UPDATE reviews SET moderation_status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :id');
    $update->execute(['status' => $nextStatus, 'id' => $id]);
    $db->commit();
    $labels = ['published' => 'Published review', 'flagged' => 'Flagged review as spam', 'removed' => 'Removed review'];
    log_activity($admin, 'Reviews', $labels[$nextStatus], $review['customer_name'] . ' · ' . $review['product_name'] . ' (review #' . $id . ').');
    respond(200, ['message' => 'Review updated.']);
} catch (PDOException $exception) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    error_log('Scentare reviews database error: ' . $exception->getMessage());
    respond(500, ['message' => 'Could not load reviews. Check the database connection and schema.']);
} catch (Throwable $exception) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    error_log('Scentare reviews API error: ' . $exception->getMessage());
    respond(500, ['message' => 'Could not process the review request.']);
}
