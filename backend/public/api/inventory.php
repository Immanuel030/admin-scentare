<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/api.php';
require_once __DIR__ . '/../../services/ActivityLogger.php';

try {
    $admin = require_admin();
    $db = database();
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET') {
        $settings = $db->query('SELECT low_threshold, critical_threshold FROM inventory_settings WHERE id = 1')->fetch();
        if (!$settings) $settings = ['low_threshold' => 10, 'critical_threshold' => 5];
        respond(200, ['low' => (int) $settings['low_threshold'], 'critical' => (int) $settings['critical_threshold']]);
    }

    if ($method !== 'POST') respond(405, ['message' => 'Method not allowed.']);
    require_csrf();
    $input = json_decode(file_get_contents('php://input'), true);
    $low = filter_var($input['low'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    $critical = filter_var($input['critical'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]);
    if ($low === false || $critical === false || $low <= $critical) {
        respond(422, ['message' => 'The low threshold must be a whole number greater than the critical threshold.']);
    }

    $statement = $db->prepare(<<<'SQL'
        INSERT INTO inventory_settings (id, low_threshold, critical_threshold, updated_at)
        VALUES (1, :low, :critical, CURRENT_TIMESTAMP)
        ON DUPLICATE KEY UPDATE low_threshold = VALUES(low_threshold), critical_threshold = VALUES(critical_threshold), updated_at = CURRENT_TIMESTAMP
    SQL);
    $statement->execute(['low' => $low, 'critical' => $critical]);
    log_activity($admin, 'Inventory', 'Changed inventory alert thresholds', "Low-stock threshold set to {$low}; critical threshold set to {$critical}.");
    respond(200, ['message' => 'Thresholds saved.']);
} catch (PDOException $exception) {
    error_log('Scentare inventory database error: ' . $exception->getMessage());
    respond(500, ['message' => 'Could not save inventory settings. Check the database connection and schema.']);
} catch (Throwable $exception) {
    error_log('Scentare inventory API error: ' . $exception->getMessage());
    respond(500, ['message' => 'Could not process the inventory request.']);
}
