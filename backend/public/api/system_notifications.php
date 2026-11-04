<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/api.php';
require_once __DIR__ . '/../../services/ActivityLogger.php';

function notification_uuid(): string
{
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    $hex = bin2hex($bytes);
    return substr($hex, 0, 8) . '-' . substr($hex, 8, 4) . '-' . substr($hex, 12, 4) . '-' . substr($hex, 16, 4) . '-' . substr($hex, 20);
}

try {
    $admin = require_admin();
    $db = database();
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET') {
        $settings = $db->query('SELECT order_confirmation, shipping_updates, back_in_stock, abandoned_cart FROM admin_notification_settings WHERE id = 1')->fetch();
        if (!$settings) $settings = ['order_confirmation' => 1, 'shipping_updates' => 1, 'back_in_stock' => 1, 'abandoned_cart' => 0];
        $notifications = $db->query('SELECT category, title, message, recipient_count, created_at FROM admin_notifications ORDER BY created_at DESC LIMIT 100')->fetchAll();
        respond(200, ['settings' => array_map('intval', $settings), 'notifications' => $notifications]);
    }

    if ($method !== 'POST') respond(405, ['message' => 'Method not allowed.']);
    require_csrf();
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) respond(400, ['message' => 'Invalid request body.']);
    $action = (string) ($input['action'] ?? '');

    if ($action === 'settings') {
        $keys = ['order_confirmation', 'shipping_updates', 'back_in_stock', 'abandoned_cart'];
        $settings = [];
        foreach ($keys as $key) {
            $value = $input['settings'][$key] ?? null;
            if (!in_array($value, [0, 1, '0', '1', true, false], true)) respond(422, ['message' => 'Choose a valid setting for each notification trigger.']);
            $settings[$key] = $value ? 1 : 0;
        }
        $statement = $db->prepare(<<<'SQL'
            INSERT INTO admin_notification_settings (id, order_confirmation, shipping_updates, back_in_stock, abandoned_cart, updated_at)
            VALUES (1, :order_confirmation, :shipping_updates, :back_in_stock, :abandoned_cart, CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE order_confirmation = VALUES(order_confirmation), shipping_updates = VALUES(shipping_updates), back_in_stock = VALUES(back_in_stock), abandoned_cart = VALUES(abandoned_cart), updated_at = CURRENT_TIMESTAMP
        SQL);
        $statement->execute($settings);
        log_activity($admin, 'System', 'Updated notification settings', 'Automated notification triggers were changed.');
        respond(200, ['message' => 'Notification settings saved.']);
    }

    if ($action !== 'compose') respond(422, ['message' => 'Choose a valid notification action.']);
    $category = (string) ($input['category'] ?? '');
    $title = trim((string) ($input['title'] ?? ''));
    $message = trim((string) ($input['message'] ?? ''));
    if (!in_array($category, ['Restock', 'Order update', 'Promo', 'Payment'], true) || $title === '' || mb_strlen($title) > 160 || $message === '' || mb_strlen($message) > 2000) {
        respond(422, ['message' => 'Enter a title and message, then choose a category.']);
    }
    $recipients = $db->query("SELECT id FROM users WHERE role = 'customer' AND is_active = 1")->fetchAll(PDO::FETCH_COLUMN);
    if (!$recipients) respond(422, ['message' => 'There are no active customer accounts to notify.']);
    $batchId = notification_uuid();
    $payload = json_encode(['category' => $category, 'title' => $title, 'message' => $message, 'batch_id' => $batchId, 'recipient_count' => count($recipients)], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($payload === false) respond(500, ['message' => 'Could not prepare the notification.']);
    $insert = $db->prepare('INSERT INTO notifications (id, type, notifiable_type, notifiable_id, data, read_at, created_at, updated_at) VALUES (:id, :type, :notifiable_type, :notifiable_id, :data, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
    $db->beginTransaction();
    foreach ($recipients as $recipientId) {
        $insert->execute(['id' => notification_uuid(), 'type' => 'App\\Notifications\\AdminAnnouncement', 'notifiable_type' => 'App\\Models\\User', 'notifiable_id' => $recipientId, 'data' => $payload]);
    }
    $adminRecord = $db->prepare('INSERT INTO admin_notifications (id, category, title, message, recipient_count, created_at) VALUES (:id, :category, :title, :message, :recipient_count, CURRENT_TIMESTAMP)');
    $adminRecord->execute(['id' => $batchId, 'category' => $category, 'title' => $title, 'message' => $message, 'recipient_count' => count($recipients)]);
    $db->commit();
    log_activity($admin, 'System', 'Sent customer notification', $title . ' · sent to ' . count($recipients) . ' active customers.');
    respond(201, ['message' => 'Notification sent to ' . count($recipients) . ' active customers.']);
} catch (PDOException $exception) {
    if (isset($db) && $db->inTransaction()) $db->rollBack();
    error_log('Scentare system notifications database error: ' . $exception->getMessage());
    respond(500, ['message' => 'Could not process notifications. Check the database connection and schema.']);
} catch (Throwable $exception) {
    if (isset($db) && $db->inTransaction()) $db->rollBack();
    error_log('Scentare system notifications error: ' . $exception->getMessage());
    respond(500, ['message' => 'Could not process notifications.']);
}
