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

final class DatabaseSessionHandler implements SessionHandlerInterface
{
    public function __construct(private PDO $db) {}
    public function open(string $path, string $name): bool { return true; }
    public function close(): bool { return true; }
    public function read(string $id): string|false
    {
        $q = $this->db->prepare('SELECT data FROM admin_sessions WHERE id = :id');
        $q->execute(['id' => $id]);
        return (string) ($q->fetchColumn() ?: '');
    }
    public function write(string $id, string $data): bool
    {
        return $this->db->prepare('INSERT INTO admin_sessions (id, data, last_activity) VALUES (:id, :data, :t)
            ON DUPLICATE KEY UPDATE data = VALUES(data), last_activity = VALUES(last_activity)')
            ->execute(['id' => $id, 'data' => $data, 't' => time()]);
    }
    public function destroy(string $id): bool
    {
        return $this->db->prepare('DELETE FROM admin_sessions WHERE id = :id')->execute(['id' => $id]);
    }
    public function gc(int $max): int|false
    {
        $q = $this->db->prepare('DELETE FROM admin_sessions WHERE last_activity < :t');
        $q->execute(['t' => time() - $max]);
        return $q->rowCount();
    }
}
if (getenv('SESSION_STORE') === 'database') {
    session_set_save_handler(new DatabaseSessionHandler(database()), true);
}

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
