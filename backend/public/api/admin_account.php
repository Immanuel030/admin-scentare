<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/api.php';
require_once __DIR__ . '/../../services/ActivityLogger.php';

try {
    $admin = require_admin();
    $db = database();
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($method === 'GET') {
        $query = $db->prepare("SELECT id, name, email, phone, role FROM users WHERE id = :id AND role = 'admin' LIMIT 1");
        $query->execute(['id' => $admin['id']]);
        $user = $query->fetch();
        if (!$user) respond(404, ['message' => 'Admin account not found.']);
        respond(200, ['user' => $user, 'permissions' => [
            ['name' => 'Products & catalog management', 'access' => 'Full access'],
            ['name' => 'Orders & payment management', 'access' => 'Full access'],
            ['name' => 'Customer account management', 'access' => 'Full access'],
            ['name' => 'Reports & activity logs', 'access' => 'Full access'],
            ['name' => 'Admin account management', 'access' => 'Full access'],
        ], 'permissionsEditable' => false]);
    }

    if ($method !== 'POST') respond(405, ['message' => 'Method not allowed.']);
    require_csrf();
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) respond(400, ['message' => 'Invalid request body.']);
    $action = (string) ($input['action'] ?? '');

    if ($action === 'profile') {
        $name = trim((string) ($input['name'] ?? ''));
        $email = strtolower(trim((string) ($input['email'] ?? '')));
        $phone = trim((string) ($input['phone'] ?? ''));
        if ($name === '' || mb_strlen($name) > 255 || !filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 255 || mb_strlen($phone) > 255) {
            respond(422, ['message' => 'Enter a valid name, email, and phone number.']);
        }
        $update = $db->prepare("UPDATE users SET name = :name, email = :email, phone = :phone, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND role = 'admin'");
        $update->execute(['name' => $name, 'email' => $email, 'phone' => $phone !== '' ? $phone : null, 'id' => $admin['id']]);
        log_activity(array_merge($admin, ['name' => $name]), 'System', 'Updated admin profile', $name . ' updated their account profile.');
        respond(200, ['message' => 'Profile updated.', 'user' => ['id' => (int) $admin['id'], 'name' => $name, 'email' => $email, 'phone' => $phone, 'role' => 'admin']]);
    }

    if ($action === 'password') {
        $currentPassword = (string) ($input['current_password'] ?? '');
        $newPassword = (string) ($input['new_password'] ?? '');
        $confirmPassword = (string) ($input['confirm_password'] ?? '');
        if (strlen($newPassword) < 8 || strlen($newPassword) > 4096 || $newPassword !== $confirmPassword) respond(422, ['message' => 'Use at least 8 characters and make both new password fields match.']);
        $passwordQuery = $db->prepare("SELECT password FROM users WHERE id = :id AND role = 'admin' LIMIT 1");
        $passwordQuery->execute(['id' => $admin['id']]);
        $hash = $passwordQuery->fetchColumn();
        if (!$hash || !password_verify($currentPassword, (string) $hash)) respond(422, ['message' => 'The current password is incorrect.']);
        $update = $db->prepare("UPDATE users SET password = :password, remember_token = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND role = 'admin'");
        $update->execute(['password' => password_hash($newPassword, PASSWORD_DEFAULT), 'id' => $admin['id']]);
        log_activity($admin, 'System', 'Changed admin password', 'Admin password was changed.');
        respond(200, ['message' => 'Password updated.']);
    }
    respond(422, ['message' => 'Choose a valid account action.']);
} catch (PDOException $exception) {
    if ($exception->getCode() === '23000') respond(409, ['message' => 'That email address is already in use.']);
    error_log('Scentare admin account database error: ' . $exception->getMessage());
    respond(500, ['message' => 'Could not save admin account details.']);
} catch (Throwable $exception) {
    error_log('Scentare admin account error: ' . $exception->getMessage());
    respond(500, ['message' => 'Could not process the admin account request.']);
}
