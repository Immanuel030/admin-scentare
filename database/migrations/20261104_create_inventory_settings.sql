-- Stock alert thresholds were only ever saved to the browser's
-- localStorage, so they reset to the default on another device or
-- browser. Persist them in the shared database instead.
CREATE TABLE `inventory_settings` (
  `id` tinyint(3) UNSIGNED NOT NULL,
  `low_threshold` int(10) UNSIGNED NOT NULL DEFAULT 10,
  `critical_threshold` int(10) UNSIGNED NOT NULL DEFAULT 5,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `inventory_settings` (`id`, `low_threshold`, `critical_threshold`)
VALUES (1, 10, 5);
