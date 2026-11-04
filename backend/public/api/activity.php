<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/api.php';
require_once __DIR__ . '/../../services/ActivityLogger.php';

try {
    $adminUser = require_admin();
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($method === 'POST') {
        require_csrf();
        $input = json_decode(file_get_contents('php://input'), true);
        if (!is_array($input)) {
            respond(400, ['message' => 'Invalid request body.']);
        }
        $moduleName = trim((string) ($input['module'] ?? ''));
        $actionName = mb_substr(trim((string) ($input['action'] ?? '')), 0, 255);
        $details = mb_substr(trim((string) ($input['details'] ?? '')), 0, 2000);
        if ($moduleName !== 'Inventory' || $actionName !== 'Changed inventory alert thresholds') {
            respond(422, ['message' => 'Invalid activity event.']);
        }
        log_activity($adminUser, $moduleName, $actionName, $details);
        respond(201, ['message' => 'Activity recorded.']);
    }
    if ($method !== 'GET') {
        respond(405, ['message' => 'Method not allowed.']);
    }

    $page = max(1, (int) ($_GET['page'] ?? 1));
    $perPage = ($_GET['export'] ?? '') === '1' ? 10000 : 10;
    $admin = mb_substr(trim((string) ($_GET['admin'] ?? '')), 0, 255);
    $module = mb_substr(trim((string) ($_GET['module'] ?? '')), 0, 80);
    $search = mb_substr(trim((string) ($_GET['search'] ?? '')), 0, 100);
    $conditions = [];
    $parameters = [];
    if ($admin !== '') {
        $conditions[] = 'actor_name = :admin';
        $parameters['admin'] = $admin;
    }
    if ($module !== '') {
        $conditions[] = 'module = :module';
        $parameters['module'] = $module;
    }
    if ($search !== '') {
        $conditions[] = '(actor_name LIKE :actor_search OR action LIKE :action_search OR details LIKE :details_search)';
        $like = '%' . $search . '%';
        $parameters['actor_search'] = $like;
        $parameters['action_search'] = $like;
        $parameters['details_search'] = $like;
    }
    $where = $conditions ? ' WHERE ' . implode(' AND ', $conditions) : '';
    $db = database();
    $count = $db->prepare('SELECT COUNT(*) FROM activity_logs' . $where);
    $count->execute($parameters);
    $total = (int) $count->fetchColumn();
    $pageCount = max(1, (int) ceil($total / $perPage));
    $page = min($page, $pageCount);
    $entriesQuery = $db->prepare('SELECT id, actor_name, module, action, details, created_at FROM activity_logs' . $where . ' ORDER BY created_at DESC, id DESC LIMIT :limit OFFSET :offset');
    foreach ($parameters as $key => $value) {
        $entriesQuery->bindValue(':' . $key, $value, PDO::PARAM_STR);
    }
    $entriesQuery->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $entriesQuery->bindValue(':offset', ($page - 1) * $perPage, PDO::PARAM_INT);
    $entriesQuery->execute();
    $entries = $entriesQuery->fetchAll();
    $admins = $db->query('SELECT DISTINCT actor_name FROM activity_logs ORDER BY actor_name ASC')->fetchAll(PDO::FETCH_COLUMN);
    $modules = $db->query('SELECT DISTINCT module FROM activity_logs ORDER BY module ASC')->fetchAll(PDO::FETCH_COLUMN);
    respond(200, [
        'entries' => $entries,
        'total' => $total,
        'page' => $page,
        'perPage' => $perPage,
        'pageCount' => $pageCount,
        'admins' => $admins,
        'modules' => $modules,
    ]);
} catch (PDOException $exception) {
    error_log('Scentare activity database error: ' . $exception->getMessage());
    respond(500, ['message' => 'Could not load activity logs. Check the database connection and schema.']);
} catch (Throwable $exception) {
    error_log('Scentare activity API error: ' . $exception->getMessage());
    respond(500, ['message' => 'Could not load activity logs.']);
}
