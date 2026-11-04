<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/api.php';
require_once __DIR__ . '/../../services/ActivityLogger.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    $admin = require_admin();

    if ($method === 'GET') {
        $page = max(1, (int) ($_GET['page'] ?? 1));
        $perPage = 10;
        $status = (string) ($_GET['status'] ?? 'all');
        if (!in_array($status, ['all', 'active', 'suspended'], true)) {
            $status = 'all';
        }
        $search = trim((string) ($_GET['search'] ?? ''));
        $search = mb_substr($search, 0, 100);
        $statusCondition = match ($status) {
            'active' => ' AND u.is_active = 1',
            'suspended' => ' AND u.is_active = 0',
            default => '',
        };
        $searchCondition = $search !== '' ? ' AND (u.name LIKE :name_search OR u.email LIKE :email_search)' : '';
        $base = "FROM users u WHERE u.role = 'customer'" . $statusCondition . $searchCondition;
        $count = database()->prepare('SELECT COUNT(*) ' . $base);
        if ($search !== '') {
            $count->bindValue(':name_search', '%' . $search . '%', PDO::PARAM_STR);
            $count->bindValue(':email_search', '%' . $search . '%', PDO::PARAM_STR);
        }
        $count->execute();
        $total = (int) $count->fetchColumn();
        $pageCount = max(1, (int) ceil($total / $perPage));
        $page = min($page, $pageCount);
        $offset = ($page - 1) * $perPage;

        $query = database()->prepare(<<<'SQL'
            SELECT u.id, u.name, u.email, u.phone, u.created_at, u.is_active,
                   COUNT(DISTINCT o.id) AS orders_count,
                   COALESCE(SUM(CASE WHEN o.payment_status = 'paid' OR o.status = 'delivered' THEN o.total ELSE 0 END), 0) AS total_spent,
                   MAX(o.created_at) AS last_order_at
            FROM users u
            LEFT JOIN orders o ON o.user_id = u.id
            WHERE u.role = 'customer'
        SQL . $statusCondition . ($search !== '' ? ' AND (u.name LIKE :name_search OR u.email LIKE :email_search)' : '') . '
            GROUP BY u.id, u.name, u.email, u.phone, u.created_at, u.is_active
            ORDER BY u.created_at DESC, u.id DESC
            LIMIT :limit OFFSET :offset');
        if ($search !== '') {
            $query->bindValue(':name_search', '%' . $search . '%', PDO::PARAM_STR);
            $query->bindValue(':email_search', '%' . $search . '%', PDO::PARAM_STR);
        }
        $query->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $query->bindValue(':offset', $offset, PDO::PARAM_INT);
        $query->execute();
        $customers = $query->fetchAll();

        $statusCounts = [];
        foreach (['all' => '', 'active' => ' AND is_active = 1', 'suspended' => ' AND is_active = 0'] as $key => $condition) {
            $statement = database()->query("SELECT COUNT(*) FROM users WHERE role = 'customer'{$condition}");
            $statusCounts[$key] = (int) $statement->fetchColumn();
        }
        respond(200, [
            'customers' => $customers,
            'total' => $total,
            'page' => $page,
            'perPage' => $perPage,
            'pageCount' => $pageCount,
            'counts' => $statusCounts,
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
    $action = $input['action'] ?? '';
    if (!$id || !in_array($action, ['suspend', 'activate'], true)) {
        respond(422, ['message' => 'Invalid customer status request.']);
    }
    $customerQuery = database()->prepare("SELECT name FROM users WHERE id = :id AND role = 'customer'");
    $customerQuery->execute(['id' => $id]);
    $customer = $customerQuery->fetch();
    if (!$customer) {
        respond(404, ['message' => 'Customer not found.']);
    }
    $active = $action === 'activate' ? 1 : 0;
    $statement = database()->prepare("UPDATE users SET is_active = :active, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND role = 'customer'");
    $statement->execute(['active' => $active, 'id' => $id]);
    if ($statement->rowCount() === 0) {
    }
    log_activity($admin, 'Customers', $active ? 'Reactivated customer account' : 'Suspended customer account', $customer['name'] . ' (customer #' . $id . ').');
    respond(200, ['message' => $active ? 'Customer activated.' : 'Customer suspended.']);
} catch (PDOException $exception) {
    error_log('Scentare customers database error: ' . $exception->getMessage());
    respond(500, ['message' => 'Could not load customer data. Check the database connection and schema.']);
} catch (Throwable $exception) {
    error_log('Scentare customers API error: ' . $exception->getMessage());
    respond(500, ['message' => 'Could not process the customer request.']);
}
