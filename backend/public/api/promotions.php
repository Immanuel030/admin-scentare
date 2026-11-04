<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/api.php';
require_once __DIR__ . '/../../services/ActivityLogger.php';

$statusSql = "CASE WHEN p.is_active = 0 THEN 'paused' WHEN p.ends_at IS NOT NULL AND p.ends_at < CURRENT_TIMESTAMP THEN 'expired' WHEN p.usage_limit IS NOT NULL AND p.usage_count >= p.usage_limit THEN 'expired' WHEN p.starts_at > CURRENT_TIMESTAMP THEN 'scheduled' ELSE 'active' END";

try {
    $admin = require_admin();
    $db = database();
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET') {
        $filter = (string) ($_GET['status'] ?? 'all');
        $allowed = ['all', 'active', 'scheduled', 'expired', 'paused'];
        if (!in_array($filter, $allowed, true)) $filter = 'all';
        $search = mb_substr(trim((string) ($_GET['search'] ?? '')), 0, 100);
        $where = ' WHERE 1 = 1';
        $params = [];
        if ($filter !== 'all') { $where .= " AND {$statusSql} = :status"; $params['status'] = $filter; }
        if ($search !== '') {
            $where .= ' AND (p.name LIKE :name_search OR p.code LIKE :code_search OR p.discount_type LIKE :type_search)';
            $like = '%' . $search . '%';
            $params += ['name_search' => $like, 'code_search' => $like, 'type_search' => $like];
        }
        $query = $db->prepare("SELECT p.id, p.name, p.code, p.discount_type, p.discount_value, p.buy_quantity, p.usage_limit, p.usage_count, p.starts_at, p.ends_at, p.is_active, p.created_at, p.updated_at, {$statusSql} AS status FROM promotions p{$where} ORDER BY p.starts_at DESC, p.id DESC");
        $query->execute($params);
        $counts = [];
        foreach ($allowed as $key) {
            if ($key === 'all') $counts[$key] = (int) $db->query('SELECT COUNT(*) FROM promotions')->fetchColumn();
            else {
                $countQuery = $db->query("SELECT COUNT(*) FROM promotions p WHERE {$statusSql} = " . $db->quote($key));
                $counts[$key] = (int) $countQuery->fetchColumn();
            }
        }
        respond(200, ['promotions' => $query->fetchAll(), 'counts' => $counts]);
    }

    if ($method !== 'POST') respond(405, ['message' => 'Method not allowed.']);
    require_csrf();
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) respond(400, ['message' => 'Invalid request body.']);
    $action = (string) ($input['action'] ?? '');
    $id = filter_var($input['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);

    if (in_array($action, ['enable', 'disable'], true)) {
        if (!$id) respond(422, ['message' => 'Choose a valid promotion.']);
        $statement = $db->prepare('UPDATE promotions SET is_active = :active, updated_at = CURRENT_TIMESTAMP WHERE id = :id');
        $statement->execute(['active' => $action === 'enable' ? 1 : 0, 'id' => $id]);
        if ($statement->rowCount() === 0) {
            $check = $db->prepare('SELECT id FROM promotions WHERE id = :id');
            $check->execute(['id' => $id]);
            if (!$check->fetch()) respond(404, ['message' => 'Promotion not found.']);
        }
        log_activity($admin, 'Promotions', $action === 'enable' ? 'Enabled promotion' : 'Paused promotion', 'Promotion #' . $id . ' status changed.');
        respond(200, ['message' => $action === 'enable' ? 'Promotion enabled.' : 'Promotion paused.']);
    }

    if (!in_array($action, ['create', 'update'], true) || ($action === 'update' && !$id)) respond(422, ['message' => 'Invalid promotion action.']);
    $name = trim((string) ($input['name'] ?? ''));
    $code = strtoupper(trim((string) ($input['code'] ?? '')));
    $type = (string) ($input['discount_type'] ?? '');
    $value = filter_var($input['discount_value'] ?? null, FILTER_VALIDATE_FLOAT);
    $buyQuantity = filter_var($input['buy_quantity'] ?? 1, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    $usageLimit = ($input['usage_limit'] ?? '') === '' || ($input['usage_limit'] ?? null) === null ? null : filter_var($input['usage_limit'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    $startsRaw = trim((string) ($input['starts_at'] ?? ''));
    $endsRaw = trim((string) ($input['ends_at'] ?? ''));
    $starts = DateTimeImmutable::createFromFormat('!Y-m-d\TH:i', $startsRaw);
    $ends = $endsRaw !== '' ? DateTimeImmutable::createFromFormat('!Y-m-d\TH:i', $endsRaw) : null;
    $validTypes = ['percentage', 'fixed', 'bundle'];
    if ($name === '' || mb_strlen($name) > 160 || !preg_match('/^[A-Z0-9_-]{3,40}$/', $code) || !in_array($type, $validTypes, true) || $value === false || $value <= 0 || (in_array($type, ['percentage', 'bundle'], true) && $value > 100) || $buyQuantity === false || $usageLimit === false || !$starts || ($endsRaw !== '' && !$ends) || ($ends && $ends <= $starts)) {
        respond(422, ['message' => 'Enter a name, unique code, valid discount, and valid date range.']);
    }
    $values = ['name' => $name, 'code' => $code, 'type' => $type, 'value' => $value, 'buy_quantity' => $type === 'bundle' ? $buyQuantity : 1, 'usage_limit' => $usageLimit, 'starts_at' => $starts->format('Y-m-d H:i:s'), 'ends_at' => $ends?->format('Y-m-d H:i:s')];
    if ($action === 'create') {
        $statement = $db->prepare('INSERT INTO promotions (name, code, discount_type, discount_value, buy_quantity, usage_limit, usage_count, starts_at, ends_at, is_active, created_at, updated_at) VALUES (:name, :code, :type, :value, :buy_quantity, :usage_limit, 0, :starts_at, :ends_at, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
        $statement->execute($values);
        $newId = (int) $db->lastInsertId();
        log_activity($admin, 'Promotions', 'Created promotion', $name . ' (' . $code . ').');
        respond(201, ['message' => 'Promotion created.', 'id' => $newId]);
    }
    $values['id'] = $id;
    $statement = $db->prepare('UPDATE promotions SET name = :name, code = :code, discount_type = :type, discount_value = :value, buy_quantity = :buy_quantity, usage_limit = :usage_limit, starts_at = :starts_at, ends_at = :ends_at, updated_at = CURRENT_TIMESTAMP WHERE id = :id');
    $statement->execute($values);
    log_activity($admin, 'Promotions', 'Updated promotion', $name . ' (' . $code . ').');
    respond(200, ['message' => 'Promotion updated.']);
} catch (PDOException $exception) {
    if ($exception->getCode() === '23000') respond(409, ['message' => 'That promotion code is already in use.']);
    error_log('Scentare promotions database error: ' . $exception->getMessage());
    respond(500, ['message' => 'Could not save promotions. Make sure the promotions migration has been applied.']);
} catch (Throwable $exception) {
    error_log('Scentare promotions API error: ' . $exception->getMessage());
    respond(500, ['message' => 'Could not process the promotions request.']);
}
