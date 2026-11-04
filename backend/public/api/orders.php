<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/api.php';
require_once __DIR__ . '/../../services/ActivityLogger.php';
require_once __DIR__ . '/../../services/AdminNotificationService.php';

$transitions = [
    'pending' => ['confirmed', 'cancelled'],
    'confirmed' => ['preparing', 'cancelled'],
    'preparing' => ['packed', 'cancelled'],
    'packed' => ['shipped', 'cancelled'],
    'shipped' => ['out_for_delivery', 'delivered', 'failed_delivery', 'cancelled'],
    'out_for_delivery' => ['delivered', 'failed_delivery', 'returned_to_sender'],
    'failed_delivery' => ['out_for_delivery', 'returned_to_sender', 'cancelled'],
    'delivered' => [],
    'returned_to_sender' => [],
    'cancelled' => [],
];

try {
    $admin = require_admin();
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET') {
        $db = database();
        if (isset($_GET['id'])) {
            $id = filter_var($_GET['id'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if (!$id) {
                respond(422, ['message' => 'A valid order is required.']);
            }
            $orderQuery = $db->prepare(<<<'SQL'
                SELECT o.*, u.email AS customer_email
                FROM orders o
                LEFT JOIN users u ON u.id = o.user_id
                WHERE o.id = :id
                LIMIT 1
            SQL);
            $orderQuery->execute(['id' => $id]);
            $order = $orderQuery->fetch();
            if (!$order) {
                respond(404, ['message' => 'Order not found.']);
            }
            $itemsQuery = $db->prepare('SELECT id, product_name, product_image, price, quantity, subtotal FROM order_items WHERE order_id = :id ORDER BY id ASC');
            $itemsQuery->execute(['id' => $id]);
            $historyQuery = $db->prepare('SELECT status, note, created_at FROM order_status_logs WHERE order_id = :id ORDER BY created_at DESC, id DESC');
            $historyQuery->execute(['id' => $id]);
            $order['items'] = $itemsQuery->fetchAll();
            $order['history'] = $historyQuery->fetchAll();
            $riders = $db->query("SELECT id, name, phone FROM users WHERE role = 'delivery' AND is_active = 1 ORDER BY name ASC")->fetchAll();
            respond(200, ['order' => $order, 'transitions' => $transitions[$order['status']] ?? [], 'riders' => $riders]);
        }

        $page = max(1, (int) ($_GET['page'] ?? 1));
        $perPage = ($_GET['export'] ?? '') === '1' ? 10000 : 10;
        $status = (string) ($_GET['status'] ?? 'all');
        $allowedFilters = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!in_array($status, $allowedFilters, true)) {
            $status = 'all';
        }
        $search = mb_substr(trim((string) ($_GET['search'] ?? '')), 0, 100);
        $statusCondition = match ($status) {
            'pending' => " AND o.status = 'pending'",
            'processing' => " AND o.status IN ('confirmed', 'preparing', 'packed')",
            'shipped' => " AND o.status IN ('shipped', 'out_for_delivery')",
            'delivered' => " AND o.status = 'delivered'",
            'cancelled' => " AND o.status IN ('cancelled', 'failed_delivery', 'returned_to_sender')",
            default => '',
        };
        $searchCondition = $search !== '' ? ' AND (o.order_number LIKE :order_search OR o.full_name LIKE :name_search OR u.email LIKE :email_search)' : '';
        $from = ' FROM orders o LEFT JOIN users u ON u.id = o.user_id WHERE 1 = 1' . $statusCondition . $searchCondition;
        $count = $db->prepare('SELECT COUNT(*)' . $from);
        if ($search !== '') {
            $like = '%' . $search . '%';
            $count->bindValue(':order_search', $like, PDO::PARAM_STR);
            $count->bindValue(':name_search', $like, PDO::PARAM_STR);
            $count->bindValue(':email_search', $like, PDO::PARAM_STR);
        }
        $count->execute();
        $total = (int) $count->fetchColumn();
        $pageCount = max(1, (int) ceil($total / $perPage));
        $page = min($page, $pageCount);
        $query = $db->prepare(<<<'SQL'
            SELECT o.id, o.order_number, o.full_name AS customer, u.email AS customer_email,
                   o.created_at, o.total, o.shipping_fee, o.status, o.payment_status,
                   CASE WHEN o.shipping_fee > 0 THEN 'Local delivery' ELSE 'Store pickup' END AS delivery,
                   COALESCE(items.summary, 'No items') AS items
            FROM orders o
            LEFT JOIN users u ON u.id = o.user_id
            LEFT JOIN (
                SELECT order_id,
                       GROUP_CONCAT(CONCAT(product_name, ' ×', quantity) ORDER BY id SEPARATOR ', ') AS summary
                FROM order_items GROUP BY order_id
            ) items ON items.order_id = o.id
            WHERE 1 = 1
        SQL . $statusCondition . ($search !== '' ? ' AND (o.order_number LIKE :order_search OR o.full_name LIKE :name_search OR u.email LIKE :email_search)' : '') . '
            ORDER BY o.created_at DESC, o.id DESC
            LIMIT :limit OFFSET :offset');
        if ($search !== '') {
            $like = '%' . $search . '%';
            $query->bindValue(':order_search', $like, PDO::PARAM_STR);
            $query->bindValue(':name_search', $like, PDO::PARAM_STR);
            $query->bindValue(':email_search', $like, PDO::PARAM_STR);
        }
        $query->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $query->bindValue(':offset', ($page - 1) * $perPage, PDO::PARAM_INT);
        $query->execute();
        $orders = $query->fetchAll();
        $counts = [];
        foreach ($allowedFilters as $filter) {
            $condition = match ($filter) {
                'pending' => " AND status = 'pending'",
                'processing' => " AND status IN ('confirmed', 'preparing', 'packed')",
                'shipped' => " AND status IN ('shipped', 'out_for_delivery')",
                'delivered' => " AND status = 'delivered'",
                'cancelled' => " AND status IN ('cancelled', 'failed_delivery', 'returned_to_sender')",
                default => '',
            };
            $counts[$filter] = (int) $db->query('SELECT COUNT(*) FROM orders WHERE 1 = 1' . $condition)->fetchColumn();
        }
        respond(200, ['orders' => $orders, 'total' => $total, 'page' => $page, 'perPage' => $perPage, 'pageCount' => $pageCount, 'counts' => $counts]);
    }

    if ($method !== 'POST') {
        respond(405, ['message' => 'Method not allowed.']);
    }
    require_csrf();
    $input = json_decode(file_get_contents('php://input'), true);
    $action = is_array($input) ? (string) ($input['action'] ?? '') : '';
    if (!in_array($action, ['update_status', 'assign_rider'], true)) {
        respond(400, ['message' => 'Invalid order update.']);
    }

    if ($action === 'assign_rider') {
        $db = database();
        $id = filter_var($input['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        $riderId = filter_var($input['rider_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if (!$id) {
            respond(422, ['message' => 'A valid order is required.']);
        }

        $orderQuery = $db->prepare('SELECT order_number, status FROM orders WHERE id = :id');
        $orderQuery->execute(['id' => $id]);
        $order = $orderQuery->fetch();
        if (!$order) {
            respond(404, ['message' => 'Order not found.']);
        }

        if ($riderId) {
            $riderQuery = $db->prepare("SELECT id, name, phone FROM users WHERE id = :id AND role = 'delivery' AND is_active = 1");
            $riderQuery->execute(['id' => $riderId]);
            $rider = $riderQuery->fetch();
            if (!$rider) {
                respond(422, ['message' => 'Choose an active rider account.']);
            }
            $update = $db->prepare('UPDATE orders SET rider_id = :rider_id, rider_name = :rider_name, rider_phone = :rider_phone, updated_at = CURRENT_TIMESTAMP WHERE id = :id');
            $update->execute(['rider_id' => $rider['id'], 'rider_name' => $rider['name'], 'rider_phone' => $rider['phone'], 'id' => $id]);
            log_activity($admin, 'Orders', 'Assigned rider', $order['order_number'] . ' assigned to ' . $rider['name'] . '.');
        } else {
            $update = $db->prepare('UPDATE orders SET rider_id = NULL, rider_name = NULL, rider_phone = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = :id');
            $update->execute(['id' => $id]);
            log_activity($admin, 'Orders', 'Unassigned rider', $order['order_number'] . ' rider removed.');
        }

        respond(200, ['message' => 'Rider assignment updated.']);
    }

    $id = filter_var($input['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    $nextStatus = (string) ($input['status'] ?? '');
    if (!$id) {
        respond(422, ['message' => 'A valid order is required.']);
    }

    $db = database();
    $db->beginTransaction();
    $currentQuery = $db->prepare('SELECT order_number, user_id, status FROM orders WHERE id = :id FOR UPDATE');
    $currentQuery->execute(['id' => $id]);
    $current = $currentQuery->fetch();
    if (!$current) {
        $db->rollBack();
        respond(404, ['message' => 'Order not found.']);
    }
    $allowed = $transitions[$current['status']] ?? [];
    if (!in_array($nextStatus, $allowed, true)) {
        $db->rollBack();
        respond(422, ['message' => 'That status change is not allowed for this order.']);
    }

    $update = $db->prepare(<<<'SQL'
        UPDATE orders
        SET status = :next_status,
            updated_at = CURRENT_TIMESTAMP,
            out_for_delivery_at = CASE WHEN :delivery_status = 'out_for_delivery' AND out_for_delivery_at IS NULL THEN CURRENT_TIMESTAMP ELSE out_for_delivery_at END,
            delivered_at = CASE WHEN :delivered_status = 'delivered' AND delivered_at IS NULL THEN CURRENT_TIMESTAMP ELSE delivered_at END
        WHERE id = :id
    SQL);
    $update->execute([
        'next_status' => $nextStatus,
        'delivery_status' => $nextStatus,
        'delivered_status' => $nextStatus,
        'id' => $id,
    ]);
    $note = 'Status changed from ' . str_replace('_', ' ', $current['status']) . ' to ' . str_replace('_', ' ', $nextStatus) . ' by ' . ($admin['name'] ?? 'Administrator') . '.';
    $history = $db->prepare('INSERT INTO order_status_logs (order_id, status, note, created_at) VALUES (:order_id, :status, :note, CURRENT_TIMESTAMP)');
    $history->execute(['order_id' => $id, 'status' => $nextStatus, 'note' => $note]);

    // Cancelling or returning an order releases the stock it held —
    // otherwise the cancelled quantity stays locked out of inventory
    // forever.
    if (in_array($nextStatus, ['cancelled', 'returned_to_sender'], true)) {
        $restock = $db->prepare(<<<'SQL'
            UPDATE products p
            INNER JOIN order_items oi ON oi.product_id = p.id
            SET p.stock = p.stock + oi.quantity
            WHERE oi.order_id = :order_id
        SQL);
        $restock->execute(['order_id' => $id]);
    }

    $db->commit();

    notify_order_status($db, (int) $current['user_id'], $id, $current['order_number'], $nextStatus);

    log_activity($admin, 'Orders', 'Updated order status', $current['order_number'] . ' changed to ' . str_replace('_', ' ', $nextStatus) . '.');
    respond(200, ['message' => 'Order status updated.']);
} catch (PDOException $exception) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    error_log('Scentare orders database error: ' . $exception->getMessage());
    respond(500, ['message' => 'Could not process the order request. Check the database connection and schema.']);
} catch (Throwable $exception) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    error_log('Scentare orders API error: ' . $exception->getMessage());
    respond(500, ['message' => 'Could not process the order request.']);
}
