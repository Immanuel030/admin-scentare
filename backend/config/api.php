<?php
declare(strict_types=1);

require_once __DIR__ . '/database.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

session_name(getenv('SESSION_NAME') ?: 'scentare_admin_session');
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();

function respond(int $status, array $body): never
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_SLASHES);
    exit;
}

function require_csrf(): void
{
    $provided = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!is_string($provided) || !isset($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $provided)) {
        respond(419, ['message' => 'Your session expired. Refresh the page and try again.']);
    }
}

function current_admin(): ?array
{
    if (!isset($_SESSION['user_id'])) {
        return null;
    }

    $query = database()->prepare("SELECT id, name, email, role FROM users WHERE id = :id AND role = 'admin' LIMIT 1");
    $query->execute(['id' => $_SESSION['user_id']]);
    $user = $query->fetch();
    if (!$user) {
        session_unset();
        session_regenerate_id(true);
        return null;
    }

    return $user;
}

function require_admin(): array
{
    $user = current_admin();
    if (!$user) {
        respond(401, ['message' => 'Please sign in as an administrator.']);
    }

    return $user;
}
