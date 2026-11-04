<?php
declare(strict_types=1);

final class DashboardService
{
    public static function getData(int $lowStockThreshold = 10): array
    {
    $db = database();

    $summaryQuery = $db->prepare(<<<'SQL'
        SELECT
          (SELECT COALESCE(SUM(total), 0) FROM orders
            WHERE (payment_status = 'paid' OR status = 'delivered')
              AND created_at >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')
              AND created_at < DATE_ADD(LAST_DAY(CURRENT_DATE), INTERVAL 1 DAY)) AS month_sales,
          (SELECT COUNT(*) FROM orders
            WHERE created_at >= CURRENT_DATE
              AND created_at < DATE_ADD(CURRENT_DATE, INTERVAL 1 DAY)) AS orders_today,
          (SELECT COUNT(*) FROM orders WHERE status = 'pending') AS pending_orders,
          (SELECT COUNT(*) FROM orders) AS orders_count,
          (SELECT COUNT(*) FROM orders WHERE payment_status = 'pending') AS pending_payments,
          (SELECT COUNT(*) FROM reviews WHERE moderation_status = 'pending') AS pending_reviews,
          (SELECT COUNT(*) FROM order_issues WHERE status = 'pending') AS pending_returns,
          (SELECT COUNT(*) FROM products WHERE is_active = 1 AND stock <= :low_stock_threshold) AS low_stock_count,
          (SELECT COUNT(*) FROM products WHERE is_active = 1 AND stock = 0) AS out_of_stock_count,
          (SELECT COUNT(*) FROM users
            WHERE role = 'customer'
              AND created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY)) AS new_customers
    SQL);
    $summaryQuery->execute(['low_stock_threshold' => max(1, min(100000, $lowStockThreshold))]);
    $summary = $summaryQuery->fetch();

    $recentOrders = $db->query(<<<'SQL'
        SELECT o.id, o.order_number, o.full_name AS customer, o.total, o.status,
               o.payment_status, o.created_at, COALESCE(items.summary, 'No items') AS items
        FROM orders o
        LEFT JOIN (
          SELECT order_id,
                 GROUP_CONCAT(CONCAT(product_name, ' ×', quantity) ORDER BY id SEPARATOR ', ') AS summary
          FROM order_items
          GROUP BY order_id
        ) items ON items.order_id = o.id
        ORDER BY o.created_at DESC, o.id DESC
        LIMIT 8
    SQL)->fetchAll();

    $lowStock = $db->query(<<<'SQL'
        SELECT id, name, stock, image
        FROM products
        WHERE is_active = 1 AND stock <= 5
        ORDER BY stock ASC, name ASC
        LIMIT 6
    SQL)->fetchAll();

    $weeklyRows = $db->query(<<<'SQL'
        SELECT DATE(created_at) AS sale_date, COALESCE(SUM(total), 0) AS amount
        FROM orders
        WHERE (payment_status = 'paid' OR status = 'delivered')
          AND created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 6 DAY)
          AND created_at < DATE_ADD(CURRENT_DATE, INTERVAL 1 DAY)
        GROUP BY DATE(created_at)
        ORDER BY sale_date ASC
    SQL)->fetchAll();
    $salesByDate = [];
    foreach ($weeklyRows as $row) {
        $salesByDate[$row['sale_date']] = (float) $row['amount'];
    }
    $weeklySales = [];
    $databaseToday = new DateTimeImmutable((string) $db->query('SELECT CURRENT_DATE')->fetchColumn());
    for ($offset = 6; $offset >= 0; $offset--) {
        $date = $databaseToday->modify("-{$offset} days");
        $key = $date->format('Y-m-d');
        $weeklySales[] = [
            'label' => $date->format('D'),
            'date' => $key,
            'amount' => $salesByDate[$key] ?? 0,
        ];
    }

    $bestSellers = $db->query(<<<'SQL'
        SELECT oi.product_name AS name, oi.product_image AS image,
               SUM(oi.quantity) AS units_sold, SUM(oi.subtotal) AS revenue
        FROM order_items oi
        INNER JOIN orders o ON o.id = oi.order_id
        WHERE (o.payment_status = 'paid' OR o.status = 'delivered')
          AND o.created_at >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')
          AND o.created_at < DATE_ADD(LAST_DAY(CURRENT_DATE), INTERVAL 1 DAY)
        GROUP BY oi.product_name, oi.product_image
        ORDER BY units_sold DESC, revenue DESC
        LIMIT 3
    SQL)->fetchAll();

    $summary = array_map('intval', [
        'orders_today' => $summary['orders_today'] ?? 0,
        'pending_orders' => $summary['pending_orders'] ?? 0,
        'orders_count' => $summary['orders_count'] ?? 0,
        'pending_payments' => $summary['pending_payments'] ?? 0,
        'pending_reviews' => $summary['pending_reviews'] ?? 0,
        'pending_returns' => $summary['pending_returns'] ?? 0,
        'low_stock_count' => $summary['low_stock_count'] ?? 0,
        'out_of_stock_count' => $summary['out_of_stock_count'] ?? 0,
        'new_customers' => $summary['new_customers'] ?? 0,
    ]) + ['month_sales' => (float) ($summary['month_sales'] ?? 0)];

    foreach ($recentOrders as &$order) {
        $order['id'] = (int) $order['id'];
        $order['total'] = (float) $order['total'];
    }
    unset($order);
    foreach ($lowStock as &$product) {
        $product['id'] = (int) $product['id'];
        $product['stock'] = (int) $product['stock'];
    }
    unset($product);
    foreach ($bestSellers as &$product) {
        $product['units_sold'] = (int) $product['units_sold'];
        $product['revenue'] = (float) $product['revenue'];
    }
    unset($product);

    return [
        'generatedAt' => date(DATE_ATOM),
        'summary' => $summary,
        'recentOrders' => $recentOrders,
        'lowStock' => $lowStock,
        'weeklySales' => $weeklySales,
        'bestSellers' => $bestSellers,
    ];
    }
}
