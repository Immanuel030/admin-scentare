<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/api.php';
require_once __DIR__ . '/../../services/ActivityLogger.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    $admin = require_admin();
    $db = database();

    if ($method === 'GET') {
        $status = (string) ($_GET['status'] ?? 'all');
        if (!in_array($status, ['all', 'active', 'suspended'], true)) {
            $status = 'all';
        }
        $search = mb_substr(trim((string) ($_GET['search'] ?? '')), 0, 100);
        $statusCondition = match ($status) {
            'active' => ' AND u.is_active = 1',
            'suspended' => ' AND u.is_active = 0',
            default => '',
        };
        $searchCondition = $search !== '' ? ' AND (u.name LIKE :name_search OR u.email LIKE :email_search)' : '';

        $query = $db->prepare(<<<SQL
            SELECT u.id, u.name, u.email, u.phone, u.created_at, u.is_active,
                   COUNT(DISTINCT CASE WHEN o.status NOT IN ('delivered', 'cancelled', 'returned_to_sender', 'failed_delivery') THEN o.id END) AS active_deliveries,
                   COUNT(DISTINCT CASE WHEN o.status = 'delivered' THEN o.id END) AS completed_deliveries
            FROM users u
            LEFT JOIN orders o ON o.rider_id = u.id
            WHERE u.role = 'delivery'{$statusCondition}{$searchCondition}
            GROUP BY u.id, u.name, u.email, u.phone, u.created_at, u.is_active
            ORDER BY u.created_at DESC, u.id DESC
        SQL);
        if ($search !== '') {
            $query->bindValue(':name_search', '%' . $search . '%', PDO::PARAM_STR);
            $query->bindValue(':email_search', '%' . $search . '%', PDO::PARAM_STR);
        }
        $query->execute();
        $riders = $query->fetchAll();

        $statusCounts = [];
        foreach (['all' => '', 'active' => ' AND is_active = 1', 'suspended' => ' AND is_active = 0'] as $key => $condition) {
            $statement = $db->query("SELECT COUNT(*) FROM users WHERE role = 'delivery'{$condition}");
            $statusCounts[$key] = (int) $statement->fetchColumn();
        }

        respond(200, ['riders' => $riders, 'counts' => $statusCounts]);
    }

    if ($method !== 'POST') {
        respond(405, ['message' => 'Method not allowed.']);
    }

    require_csrf();
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        respond(400, ['message' => 'Invalid request body.']);
    }

    $action = (string) ($input['action'] ?? '');

    if (in_array($action, ['activate', 'deactivate'], true)) {
        $id = filter_var($input['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if (!$id) {
            respond(422, ['message' => 'A valid rider is required.']);
        }
        $riderQuery = $db->prepare("SELECT name FROM users WHERE id = :id AND role = 'delivery'");
        $riderQuery->execute(['id' => $id]);
        $rider = $riderQuery->fetch();
        if (!$rider) {
            respond(404, ['message' => 'Rider not found.']);
        }
        $active = $action === 'activate' ? 1 : 0;
        $db->prepare("UPDATE users SET is_active = :active, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND role = 'delivery'")
            ->execute(['active' => $active, 'id' => $id]);
        log_activity($admin, 'Riders', $active ? 'Activated rider account' : 'Deactivated rider account', $rider['name'] . ' (rider #' . $id . ').');
        respond(200, ['message' => $active ? 'Rider activated.' : 'Rider deactivated.']);
    }

    if ($action === 'reset_password') {
        $id = filter_var($input['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        $password = (string) ($input['password'] ?? '');
        if (!$id || strlen($password) < 8 || strlen($password) > 4096) {
            respond(422, ['message' => 'Choose a rider and a password of at least 8 characters.']);
        }
        $riderQuery = $db->prepare("SELECT name FROM users WHERE id = :id AND role = 'delivery'");
        $riderQuery->execute(['id' => $id]);
        $rider = $riderQuery->fetch();
        if (!$rider) {
            respond(404, ['message' => 'Rider not found.']);
        }
        $db->prepare("UPDATE users SET password = :password, remember_token = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND role = 'delivery'")
            ->execute(['password' => password_hash($password, PASSWORD_DEFAULT), 'id' => $id]);
        log_activity($admin, 'Riders', 'Reset rider password', $rider['name'] . ' (rider #' . $id . ').');
        respond(200, ['message' => 'Password reset.']);
    }

    if (!in_array($action, ['create', 'update'], true)) {
        respond(422, ['message' => 'Choose a valid rider action.']);
    }

    $id = filter_var($input['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if ($action === 'update' && !$id) {
        respond(422, ['message' => 'A valid rider is required.']);
    }

    $name = trim((string) ($input['name'] ?? ''));
    $email = strtolower(trim((string) ($input['email'] ?? '')));
    $phone = trim((string) ($input['phone'] ?? ''));
    $password = (string) ($input['password'] ?? '');

    if ($name === '' || mb_strlen($name) > 255 || !filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 255 || mb_strlen($phone) > 255) {
        respond(422, ['message' => 'Enter a valid rider name, email, and phone number.']);
    }
    if ($action === 'create' && (strlen($password) < 8 || strlen($password) > 4096)) {
        respond(422, ['message' => 'Choose a password of at least 8 characters for the new rider.']);
    }

    $duplicateQuery = $db->prepare(
        $action === 'create'
            ? 'SELECT id FROM users WHERE LOWER(email) = :email LIMIT 1'
            : 'SELECT id FROM users WHERE LOWER(email) = :email AND id != :id LIMIT 1'
    );
    $duplicateQuery->execute($action === 'create' ? ['email' => $email] : ['email' => $email, 'id' => $id]);
    if ($duplicateQuery->fetch()) {
        respond(422, ['message' => 'A user with that email already exists.']);
    }

    if ($action === 'create') {
        $db->prepare(<<<'SQL'
            INSERT INTO users (name, email, phone, password, role, is_active, email_verified_at, created_at, updated_at)
            VALUES (:name, :email, :phone, :password, 'delivery', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        SQL)->execute([
            'name' => $name,
            'email' => $email,
            'phone' => $phone !== '' ? $phone : null,
            'password' => password_hash($password, PASSWORD_DEFAULT),
        ]);
        $newId = (int) $db->lastInsertId();
        log_activity($admin, 'Riders', 'Created rider account', $name . ' (rider #' . $newId . ').');
        respond(201, ['message' => 'Rider account created.', 'id' => $newId]);
    }

    $riderQuery = $db->prepare("SELECT id FROM users WHERE id = :id AND role = 'delivery'");
    $riderQuery->execute(['id' => $id]);
    if (!$riderQuery->fetch()) {
        respond(404, ['message' => 'Rider not found.']);
    }

    $db->prepare("UPDATE users SET name = :name, email = :email, phone = :phone, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND role = 'delivery'")
        ->execute([
            'name' => $name,
            'email' => $email,
            'phone' => $phone !== '' ? $phone : null,
            'id' => $id,
        ]);
    log_activity($admin, 'Riders', 'Updated rider account', $name . ' (rider #' . $id . ').');
    respond(200, ['message' => 'Rider updated.']);
} catch (PDOException $exception) {
    if ($exception->getCode() === '23000') {
        respond(409, ['message' => 'That email address is already in use.']);
    }
    error_log('Scentare riders database error: ' . $exception->getMessage());
    respond(500, ['message' => 'Could not save rider data. Check the database connection and schema.']);
} catch (Throwable $exception) {
    error_log('Scentare riders API error: ' . $exception->getMessage());
    respond(500, ['message' => 'Could not process the rider request.']);
}
