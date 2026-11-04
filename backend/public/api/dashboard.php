<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/api.php';
require_once __DIR__ . '/../../services/DashboardService.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    respond(405, ['message' => 'Method not allowed.']);
}

try {
    require_admin();
    $threshold = filter_var($_GET['lowStockThreshold'] ?? 10, FILTER_VALIDATE_INT);
    $threshold = $threshold === false ? 10 : max(1, min(100000, $threshold));
    respond(200, DashboardService::getData($threshold));
} catch (PDOException $exception) {
    error_log('Scentare dashboard database error: ' . $exception->getMessage());
    respond(500, ['message' => 'Could not load dashboard data. Check the database schema and connection.']);
} catch (Throwable $exception) {
    error_log('Scentare dashboard error: ' . $exception->getMessage());
    respond(500, ['message' => 'Could not load dashboard data.']);
}
