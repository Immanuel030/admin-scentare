-- Persist notification automation preferences for the admin portal.
CREATE TABLE `admin_notification_settings` (
  `id` tinyint(3) UNSIGNED NOT NULL,
  `order_confirmation` tinyint(1) NOT NULL DEFAULT 1,
  `shipping_updates` tinyint(1) NOT NULL DEFAULT 1,
  `back_in_stock` tinyint(1) NOT NULL DEFAULT 1,
  `abandoned_cart` tinyint(1) NOT NULL DEFAULT 0,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `admin_notification_settings` (`id`, `order_confirmation`, `shipping_updates`, `back_in_stock`, `abandoned_cart`)
VALUES (1, 1, 1, 1, 0);

-- Keep the admin inbox separate from customer delivery notifications.
CREATE TABLE `admin_notifications` (
  `id` char(36) NOT NULL,
  `category` varchar(40) NOT NULL,
  `title` varchar(160) NOT NULL,
  `message` text NOT NULL,
  `recipient_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `admin_notifications_created_at_index` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
