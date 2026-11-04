<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/api.php';
require_once __DIR__ . '/../../services/ActivityLogger.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    $admin = require_admin();

    if ($method === 'GET') {
        $categories = database()->query(<<<'SQL'
            SELECT c.id, c.name, c.slug, c.description, c.is_active,
                   COUNT(p.id) AS product_count,
                   (SELECT p2.image FROM products p2 WHERE p2.category_id = c.id ORDER BY p2.id ASC LIMIT 1) AS image
            FROM categories c
            LEFT JOIN products p ON p.category_id = c.id
            GROUP BY c.id, c.name, c.slug, c.description, c.is_active
            ORDER BY c.name ASC
        SQL)->fetchAll();
        respond(200, ['categories' => $categories]);
    }

    if ($method !== 'POST') {
        respond(405, ['message' => 'Method not allowed.']);
    }

    require_csrf();
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        respond(400, ['message' => 'Invalid request body.']);
    }

    $action = $input['action'] ?? '';
    $id = filter_var($input['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if (in_array($action, ['archive', 'restore'], true)) {
        if (!$id) {
            respond(422, ['message' => 'A valid category is required.']);
        }
        $active = $action === 'restore' ? 1 : 0;
        $statement = database()->prepare('UPDATE categories SET is_active = :active, updated_at = CURRENT_TIMESTAMP WHERE id = :id');
        $statement->execute(['active' => $active, 'id' => $id]);
        if ($statement->rowCount() === 0) {
            $check = database()->prepare('SELECT id FROM categories WHERE id = :id');
            $check->execute(['id' => $id]);
            if (!$check->fetch()) {
                respond(404, ['message' => 'Category not found.']);
            }
        }
        log_activity($admin, 'Categories', $active ? 'Restored category' : 'Archived category', 'Category #' . $id . ' status changed.');
        respond(200, ['message' => $active ? 'Category restored.' : 'Category archived.']);
    }

    if (!in_array($action, ['create', 'update'], true) || ($action === 'update' && !$id)) {
        respond(422, ['message' => 'Invalid category action.']);
    }

    $name = trim((string) ($input['name'] ?? ''));
    $description = trim((string) ($input['description'] ?? ''));
    if ($name === '' || mb_strlen($name) > 255) {
        respond(422, ['message' => 'Enter a category name up to 255 characters.']);
    }

    if ($action === 'create') {
        $baseSlug = trim((string) preg_replace('/[^a-z0-9]+/i', '-', strtolower($name)), '-');
        $baseSlug = $baseSlug !== '' ? $baseSlug : 'category';
        $slug = $baseSlug;
        $suffix = 2;
        $checkSlug = database()->prepare('SELECT id FROM categories WHERE slug = :slug LIMIT 1');
        do {
            $checkSlug->execute(['slug' => $slug]);
            $exists = $checkSlug->fetch();
            if ($exists) {
                $slug = $baseSlug . '-' . $suffix++;
            }
        } while ($exists);
        $statement = database()->prepare('INSERT INTO categories (name, slug, description, is_active, created_at, updated_at) VALUES (:name, :slug, :description, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
        $statement->execute([
            'name' => $name,
            'slug' => $slug,
            'description' => $description !== '' ? $description : null,
        ]);
        log_activity($admin, 'Categories', 'Created category', $name . ' (category #' . database()->lastInsertId() . ').');
        respond(201, ['message' => 'Category created.']);
    }

    $statement = database()->prepare('UPDATE categories SET name = :name, description = :description, updated_at = CURRENT_TIMESTAMP WHERE id = :id');
    $statement->execute([
        'name' => $name,
        'description' => $description !== '' ? $description : null,
        'id' => $id,
    ]);
    log_activity($admin, 'Categories', 'Updated category', $name . ' (category #' . $id . ').');
    respond(200, ['message' => 'Category updated.']);
} catch (PDOException $exception) {
    error_log('Scentare categories database error: ' . $exception->getMessage());
    respond(500, ['message' => 'Could not save category data. Check the database connection and schema.']);
} catch (Throwable $exception) {
    error_log('Scentare categories API error: ' . $exception->getMessage());
    respond(500, ['message' => 'Could not process the category request.']);
}
