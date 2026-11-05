<?php
declare(strict_types=1);

// Single-function dispatcher for Vercel's Hobby plan (max 12 serverless
// functions per deployment) — all /api/* requests land here and get
// routed to the right script internally, instead of each PHP file under
// this folder becoming its own function.
$allowed = [
    'activity.php', 'admin_account.php', 'auth.php', 'categories.php',
    'customers.php', 'dashboard.php', 'inventory.php', 'orders.php',
    'payments.php', 'products.php', 'promotions.php', 'reports.php',
    'returns.php', 'reviews.php', 'system_notifications.php', 'uploads.php',
];

$file = basename((string) ($_GET['file'] ?? ''));

if (!in_array($file, $allowed, true)) {
    http_response_code(404);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['message' => 'Not found.']);
    exit;
}

require __DIR__ . '/' . $file;
