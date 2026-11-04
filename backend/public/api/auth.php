<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/api.php';
require_once __DIR__ . '/../../services/ActivityLogger.php';

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    if ($action === 'csrf' && $method === 'GET') {
        $_SESSION['csrf_token'] ??= bin2hex(random_bytes(32));
        respond(200, ['token' => $_SESSION['csrf_token']]);
    }

    if ($action === 'session' && $method === 'GET') {
        $user = current_admin();
        respond($user ? 200 : 401, $user ? ['user' => $user] : ['message' => 'Not signed in.']);
    }

    if ($action === 'login' && $method === 'POST') {
        require_csrf();
        $input = json_decode(file_get_contents('php://input'), true);
        $email = strtolower(trim((string) ($input['email'] ?? '')));
        $password = (string) ($input['password'] ?? '');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
            respond(422, ['message' => 'Enter a valid email and password.']);
        }

        $query = database()->prepare("SELECT id, name, email, role, password FROM users WHERE email = :email AND role = 'admin' LIMIT 1");
        $query->execute(['email' => $email]);
        $user = $query->fetch();
        if (!$user || !password_verify($password, $user['password'])) {
            respond(401, ['message' => 'The email or password is incorrect.']);
        }

        session_regenerate_id(true);
        $_SESSION['user_id'] = (int) $user['id'];
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        log_activity($user, 'System', 'Admin signed in', $user['name'] . ' signed in.');
        unset($user['password']);
        respond(200, ['user' => $user]);
    }

    if ($action === 'logout' && $method === 'POST') {
        require_csrf();
        $admin = current_admin();
        if ($admin) {
            log_activity($admin, 'System', 'Admin signed out', $admin['name'] . ' signed out.');
        }
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
        }
        session_destroy();
        respond(200, ['message' => 'Signed out.']);
    }

    respond(404, ['message' => 'Endpoint not found.']);
} catch (PDOException $exception) {
    error_log('Scentare database error: ' . $exception->getMessage());
    respond(500, ['message' => 'Sign-in service is unavailable. Check the database configuration.']);
} catch (Throwable $exception) {
    error_log('Scentare API error: ' . $exception->getMessage());
    respond(500, ['message' => 'Sign-in service is unavailable.']);
}
