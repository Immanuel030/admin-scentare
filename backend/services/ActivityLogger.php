<?php
declare(strict_types=1);

function log_activity(array $admin, string $module, string $action, string $details): void
{
    try {
        $statement = database()->prepare(<<<'SQL'
            INSERT INTO activity_logs (actor_id, actor_name, module, action, details, created_at)
            VALUES (:actor_id, :actor_name, :module, :action, :details, CURRENT_TIMESTAMP)
        SQL);
        $statement->execute([
            'actor_id' => $admin['id'] ?? null,
            'actor_name' => $admin['name'] ?? 'Administrator',
            'module' => $module,
            'action' => $action,
            'details' => $details,
        ]);
    } catch (Throwable $exception) {
        error_log('Scentare activity log error: ' . $exception->getMessage());
    }
}
