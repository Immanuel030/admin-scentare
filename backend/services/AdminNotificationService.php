<?php
declare(strict_types=1);

function admin_notification_enabled(PDO $db, string $setting): bool
{
    $allowed = ['order_confirmation', 'shipping_updates', 'back_in_stock', 'abandoned_cart'];
    if (!in_array($setting, $allowed, true)) return false;
    $query = $db->prepare('SELECT ' . $setting . ' FROM admin_notification_settings WHERE id = 1');
    $query->execute();
    $value = $query->fetchColumn();
    return $value === false ? $setting !== 'abandoned_cart' : (int) $value === 1;
}

function create_customer_notification(PDO $db, int $userId, string $type, array $data): void
{
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    $hex = bin2hex($bytes);
    $id = substr($hex, 0, 8) . '-' . substr($hex, 8, 4) . '-' . substr($hex, 12, 4) . '-' . substr($hex, 16, 4) . '-' . substr($hex, 20);
    $statement = $db->prepare('INSERT INTO notifications (id, type, notifiable_type, notifiable_id, data, read_at, created_at, updated_at) VALUES (:id, :type, :notifiable_type, :notifiable_id, :data, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
    $statement->execute(['id' => $id, 'type' => $type, 'notifiable_type' => 'App\\Models\\User', 'notifiable_id' => $userId, 'data' => json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]);
}

function create_admin_notification(PDO $db, string $category, string $title, string $message, int $recipientCount): void
{
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    $hex = bin2hex($bytes);
    $id = substr($hex, 0, 8) . '-' . substr($hex, 8, 4) . '-' . substr($hex, 12, 4) . '-' . substr($hex, 16, 4) . '-' . substr($hex, 20);
    $statement = $db->prepare('INSERT INTO admin_notifications (id, category, title, message, recipient_count, created_at) VALUES (:id, :category, :title, :message, :recipient_count, CURRENT_TIMESTAMP)');
    $statement->execute(['id' => $id, 'category' => $category, 'title' => $title, 'message' => $message, 'recipient_count' => max(0, $recipientCount)]);
}

function notify_order_status(PDO $db, int $userId, string $orderNumber, string $status): void
{
    $messages = [
        'confirmed' => ['order_confirmation', 'Your order has been confirmed and is being prepared.'],
        'shipped' => ['shipping_updates', 'Your order has shipped.'],
        'out_for_delivery' => ['shipping_updates', 'Your order is out for delivery — expect it today.'],
        'delivered' => ['shipping_updates', 'Your order has been delivered.'],
    ];
    if (!isset($messages[$status])) return;
    [$setting, $message] = $messages[$status];
    if (!admin_notification_enabled($db, $setting)) return;
    create_customer_notification($db, $userId, 'App\\Notifications\\OrderStatusUpdated', ['order_number' => $orderNumber, 'status' => $status, 'message' => $message]);
    create_admin_notification($db, 'Order update', 'Order #' . $orderNumber . ' updated', $message, 1);
}

function notify_back_in_stock(PDO $db, int $productId, string $productName): void
{
    if (!admin_notification_enabled($db, 'back_in_stock')) return;
    $query = $db->prepare("SELECT DISTINCT u.id FROM wishlist_items w INNER JOIN users u ON u.id = w.user_id WHERE w.product_id = :product_id AND u.role = 'customer' AND u.is_active = 1");
    $query->execute(['product_id' => $productId]);
    $data = ['product_id' => $productId, 'product_name' => $productName, 'message' => $productName . ' is back in stock.'];
    $recipients = $query->fetchAll(PDO::FETCH_COLUMN);
    foreach ($recipients as $userId) {
        create_customer_notification($db, (int) $userId, 'App\\Notifications\\BackInStock', $data);
    }
    if ($recipients) create_admin_notification($db, 'Restock', $productName . ' is back in stock', count($recipients) . ' wishlist customers were notified.', count($recipients));
}
