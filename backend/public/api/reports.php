<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/api.php';

try {
    require_admin();
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
        respond(405, ['message' => 'Method not allowed.']);
    }

    $days = (int) ($_GET['days'] ?? 30);
    if (!in_array($days, [7, 30, 90, 365], true)) {
        $days = 30;
    }
    $db = database();
    $today = new DateTimeImmutable((string) $db->query('SELECT CURRENT_DATE')->fetchColumn());
    $currentStart = $today->modify('-' . ($days - 1) . ' days')->format('Y-m-d');
    $end = $today->modify('+1 day')->format('Y-m-d');
    $previousEnd = $currentStart;
    $previousStart = (new DateTimeImmutable($currentStart))->modify('-' . $days . ' days')->format('Y-m-d');

    $statsQuery = $db->prepare(<<<'SQL'
        SELECT COUNT(*) AS total_orders,
               SUM(CASE WHEN payment_status = 'paid' OR status = 'delivered' THEN 1 ELSE 0 END) AS completed_orders,
               COALESCE(SUM(CASE WHEN payment_status = 'paid' OR status = 'delivered' THEN total ELSE 0 END), 0) AS revenue,
               SUM(CASE WHEN status = 'returned_to_sender' THEN 1 ELSE 0 END) AS returned_orders
        FROM orders
        WHERE created_at >= :start_date AND created_at < :end_date
    SQL);
    $statsQuery->execute(['start_date' => $currentStart, 'end_date' => $end]);
    $current = $statsQuery->fetch();
    $statsQuery->execute(['start_date' => $previousStart, 'end_date' => $previousEnd]);
    $previous = $statsQuery->fetch();

    $dailyQuery = $db->prepare(<<<'SQL'
        SELECT DATE(created_at) AS sale_date,
               COALESCE(SUM(CASE WHEN payment_status = 'paid' OR status = 'delivered' THEN total ELSE 0 END), 0) AS revenue
        FROM orders
        WHERE created_at >= :start_date AND created_at < :end_date
        GROUP BY DATE(created_at)
        ORDER BY sale_date ASC
    SQL);
    $dailyQuery->execute(['start_date' => $currentStart, 'end_date' => $end]);
    $daily = [];
    foreach ($dailyQuery->fetchAll() as $row) {
        $daily[$row['sale_date']] = (float) $row['revenue'];
    }
    $trend = [];
    for ($offset = $days - 1; $offset >= 0; $offset--) {
        $date = $today->modify('-' . $offset . ' days');
        $key = $date->format('Y-m-d');
        $trend[] = ['date' => $key, 'revenue' => $daily[$key] ?? 0];
    }

    $bestQuery = $db->prepare(<<<'SQL'
        SELECT oi.product_name AS name,
               SUM(oi.quantity) AS units_sold,
               SUM(oi.subtotal) AS revenue
        FROM order_items oi
        INNER JOIN orders o ON o.id = oi.order_id
        WHERE (o.payment_status = 'paid' OR o.status = 'delivered')
          AND o.created_at >= :start_date AND o.created_at < :end_date
        GROUP BY oi.product_id, oi.product_name
        ORDER BY units_sold DESC, revenue DESC
        LIMIT 5
    SQL);
    $bestQuery->execute(['start_date' => $currentStart, 'end_date' => $end]);
    $bestSellers = $bestQuery->fetchAll();

    $categoryQuery = $db->prepare(<<<'SQL'
        SELECT COALESCE(c.name, 'Uncategorized') AS name,
               SUM(oi.subtotal) AS revenue,
               SUM(oi.quantity) AS units_sold
        FROM order_items oi
        INNER JOIN orders o ON o.id = oi.order_id
        LEFT JOIN products p ON p.id = oi.product_id
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE (o.payment_status = 'paid' OR o.status = 'delivered')
          AND o.created_at >= :start_date AND o.created_at < :end_date
        GROUP BY c.id, c.name
        ORDER BY revenue DESC
        LIMIT 8
    SQL);
    $categoryQuery->execute(['start_date' => $currentStart, 'end_date' => $end]);
    $byCategory = $categoryQuery->fetchAll();
    $revenue = (float) ($current['revenue'] ?? 0);
    $previousRevenue = (float) ($previous['revenue'] ?? 0);
    $orders = (int) ($current['completed_orders'] ?? 0);
    $previousOrders = (int) ($previous['completed_orders'] ?? 0);
    $totalOrders = (int) ($current['total_orders'] ?? 0);
    $previousTotalOrders = (int) ($previous['total_orders'] ?? 0);
    $returnedOrders = (int) ($current['returned_orders'] ?? 0);
    $previousReturnedOrders = (int) ($previous['returned_orders'] ?? 0);

    respond(200, [
        'range' => $days,
        'startDate' => $currentStart,
        'endDate' => $today->format('Y-m-d'),
        'summary' => [
            'revenue' => $revenue,
            'orders' => $orders,
            'average_order_value' => $orders > 0 ? $revenue / $orders : 0,
            'return_rate' => $totalOrders > 0 ? ($returnedOrders / $totalOrders) * 100 : 0,
        ],
        'previous' => [
            'revenue' => $previousRevenue,
            'orders' => $previousOrders,
            'average_order_value' => $previousOrders > 0 ? $previousRevenue / $previousOrders : 0,
            'return_rate' => $previousTotalOrders > 0 ? ($previousReturnedOrders / $previousTotalOrders) * 100 : 0,
        ],
        'trend' => $trend,
        'bestSellers' => array_map(static fn (array $row): array => [
            'name' => $row['name'], 'units_sold' => (int) $row['units_sold'], 'revenue' => (float) $row['revenue'],
        ], $bestSellers),
        'byCategory' => array_map(static fn (array $row): array => [
            'name' => $row['name'], 'revenue' => (float) $row['revenue'], 'units_sold' => (int) $row['units_sold'],
        ], $byCategory),
    ]);
} catch (PDOException $exception) {
    error_log('Scentare reports database error: ' . $exception->getMessage());
    respond(500, ['message' => 'Could not load sales reports. Check the database connection and schema.']);
} catch (Throwable $exception) {
    error_log('Scentare reports API error: ' . $exception->getMessage());
    respond(500, ['message' => 'Could not load sales reports.']);
}
