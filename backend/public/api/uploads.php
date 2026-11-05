<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/api.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    require_admin();

    if ($method !== 'POST') {
        respond(405, ['message' => 'Method not allowed.']);
    }

    require_csrf();

    $target = $_GET['target'] ?? 'products';
    $allowedTargets = ['products' => 'products'];
    if (!isset($allowedTargets[$target])) {
        respond(422, ['message' => 'Unknown upload target.']);
    }

    if (!isset($_FILES['file']) || !is_array($_FILES['file'])) {
        respond(422, ['message' => 'No file was uploaded.']);
    }

    $file = $_FILES['file'];
    if ($file['error'] !== UPLOAD_ERR_OK) {
        respond(422, ['message' => 'The file upload failed. Try again.']);
    }

    $maxBytes = 4 * 1024 * 1024;
    if ($file['size'] > $maxBytes) {
        respond(422, ['message' => 'Image must be 4MB or smaller.']);
    }

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    $allowedMimes = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
    ];
    if (!isset($allowedMimes[$mime])) {
        respond(422, ['message' => 'Only JPEG, PNG, WEBP, or GIF images are allowed.']);
    }

    // Local/XAMPP dev: the shop app sits beside this one on the same disk,
    // so we write straight into its public storage folder — the same place
    // `php artisan storage:link` already exposes at <shop>/storage/<path>.
    // In production (Vercel) this must instead upload to the shared
    // S3-compatible bucket, matching UPLOADS_DISK=s3 on the shop side.
    $localShopStorage = getenv('SHOP_UPLOADS_PATH');
    if (!$localShopStorage) {
        respond(500, ['message' => 'Image uploads are not configured on this server (SHOP_UPLOADS_PATH missing).']);
    }

    $relativeDir = $allowedTargets[$target];
    $destinationDir = rtrim($localShopStorage, '\\/') . DIRECTORY_SEPARATOR . $relativeDir;
    if (!is_dir($destinationDir) && !mkdir($destinationDir, 0775, true) && !is_dir($destinationDir)) {
        respond(500, ['message' => 'Could not prepare the upload folder.']);
    }

    $filename = bin2hex(random_bytes(16)) . '.' . $allowedMimes[$mime];
    $destinationPath = $destinationDir . DIRECTORY_SEPARATOR . $filename;

    if (!move_uploaded_file($file['tmp_name'], $destinationPath)) {
        respond(500, ['message' => 'Could not save the uploaded file.']);
    }

    $relativePath = $relativeDir . '/' . $filename;
    respond(200, ['path' => $relativePath]);
} catch (Throwable $exception) {
    error_log('Scentare uploads API error: ' . $exception->getMessage());
    respond(500, ['message' => 'Could not process the upload.']);
}
