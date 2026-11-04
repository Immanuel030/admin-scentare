<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/api.php';
require_once __DIR__ . '/../../services/ActivityLogger.php';
require_once __DIR__ . '/../../services/AdminNotificationService.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    $admin = require_admin();

    if ($method === 'GET') {
        $products = database()->query(<<<'SQL'
            SELECT p.id, p.name, p.slug, p.brand, p.category_id,
                   c.name AS category_name, p.price, p.stock, p.size_ml,
                   p.image, p.is_active, p.created_at, p.updated_at
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            ORDER BY p.name ASC, p.id ASC
        SQL)->fetchAll();
        $categories = database()->query('SELECT id, name FROM categories WHERE is_active = 1 ORDER BY name ASC')->fetchAll();
        respond(200, ['products' => $products, 'categories' => $categories]);
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
    if ($action === 'restock') {
        $quantity = filter_var($input['quantity'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if (!$id || $quantity === false) {
            respond(422, ['message' => 'Choose a product and enter a restock quantity greater than zero.']);
        }
        $current = database()->prepare('SELECT name, stock FROM products WHERE id = :id');
        $current->execute(['id' => $id]);
        $product = $current->fetch();
        if (!$product) respond(404, ['message' => 'Product not found.']);
        $statement = database()->prepare('UPDATE products SET stock = stock + :quantity, updated_at = CURRENT_TIMESTAMP WHERE id = :id');
        $statement->execute(['quantity' => $quantity, 'id' => $id]);
        if ($statement->rowCount() === 0) {
            $check = database()->prepare('SELECT id FROM products WHERE id = :id');
            $check->execute(['id' => $id]);
            if (!$check->fetch()) {
                respond(404, ['message' => 'Product not found.']);
            }
        }
        if ((int) $product['stock'] === 0) notify_back_in_stock(database(), $id, $product['name']);
        log_activity($admin, 'Inventory', 'Restocked product', 'Product #' . $id . ' stock increased by ' . $quantity . ' units.');
        respond(200, ['message' => 'Inventory updated.']);
    }

    if (in_array($action, ['archive', 'restore'], true)) {
        if (!$id) {
            respond(422, ['message' => 'A valid product is required.']);
        }
        $active = $action === 'restore' ? 1 : 0;
        $statement = database()->prepare('UPDATE products SET is_active = :active, updated_at = CURRENT_TIMESTAMP WHERE id = :id');
        $statement->execute(['active' => $active, 'id' => $id]);
        if ($statement->rowCount() === 0) {
            $check = database()->prepare('SELECT id FROM products WHERE id = :id');
            $check->execute(['id' => $id]);
            if (!$check->fetch()) {
                respond(404, ['message' => 'Product not found.']);
            }
        }
        log_activity($admin, 'Products', $active ? 'Restored product' : 'Archived product', 'Product #' . $id . ' status changed.');
        respond(200, ['message' => $active ? 'Product restored.' : 'Product archived.']);
    }

    if (!in_array($action, ['create', 'update'], true) || ($action === 'update' && !$id)) {
        respond(422, ['message' => 'Invalid product action.']);
    }

    $name = trim((string) ($input['name'] ?? ''));
    $brand = trim((string) ($input['brand'] ?? ''));
    $image = trim((string) ($input['image'] ?? ''));
    $price = filter_var($input['price'] ?? null, FILTER_VALIDATE_FLOAT);
    $stock = filter_var($input['stock'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]);
    $sizeMl = ($input['size_ml'] ?? '') === '' ? null : filter_var($input['size_ml'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    $categoryId = ($input['category_id'] ?? '') === '' ? null : filter_var($input['category_id'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);

    if ($name === '' || mb_strlen($name) > 255 || $price === false || $price < 0 || $stock === false || ($sizeMl === false) || ($categoryId === false) || mb_strlen($brand) > 255 || mb_strlen($image) > 255) {
        respond(422, ['message' => 'Enter a product name, valid price and stock, and valid optional details.']);
    }

    if ($action === 'create') {
        $baseSlug = trim((string) preg_replace('/[^a-z0-9]+/i', '-', strtolower($name)), '-');
        $baseSlug = $baseSlug !== '' ? $baseSlug : 'product';
        $slug = $baseSlug;
        $suffix = 2;
        $checkSlug = database()->prepare('SELECT id FROM products WHERE slug = :slug LIMIT 1');
        do {
            $checkSlug->execute(['slug' => $slug]);
            $exists = $checkSlug->fetch();
            if ($exists) {
                $slug = $baseSlug . '-' . $suffix++;
            }
        } while ($exists);

        $statement = database()->prepare(<<<'SQL'
            INSERT INTO products (category_id, name, slug, brand, size_ml, price, stock, image, is_active, created_at, updated_at)
            VALUES (:category_id, :name, :slug, :brand, :size_ml, :price, :stock, :image, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        SQL);
        $statement->execute([
            'category_id' => $categoryId ?: null,
            'name' => $name,
            'slug' => $slug,
            'brand' => $brand !== '' ? $brand : null,
            'size_ml' => $sizeMl ?: null,
            'price' => $price,
            'stock' => $stock,
            'image' => $image !== '' ? $image : null,
        ]);
        $newId = (int) database()->lastInsertId();
        log_activity($admin, 'Products', 'Created product', $name . ' (product #' . $newId . ').');
        respond(201, ['message' => 'Product created.', 'id' => $newId]);
    }

    $statement = database()->prepare(<<<'SQL'
        UPDATE products
        SET category_id = :category_id, name = :name, brand = :brand,
            size_ml = :size_ml, price = :price, stock = :stock,
            image = :image, updated_at = CURRENT_TIMESTAMP
        WHERE id = :id
    SQL);
    $statement->execute([
        'category_id' => $categoryId ?: null,
        'name' => $name,
        'brand' => $brand !== '' ? $brand : null,
        'size_ml' => $sizeMl ?: null,
        'price' => $price,
        'stock' => $stock,
        'image' => $image !== '' ? $image : null,
        'id' => $id,
    ]);
    log_activity($admin, 'Products', 'Updated product', $name . ' (product #' . $id . ').');
    respond(200, ['message' => 'Product updated.']);
} catch (PDOException $exception) {
    error_log('Scentare products database error: ' . $exception->getMessage());
    respond(500, ['message' => 'Could not save product data. Check the database connection and schema.']);
} catch (Throwable $exception) {
    error_log('Scentare products API error: ' . $exception->getMessage());
    respond(500, ['message' => 'Could not process the product request.']);
}
