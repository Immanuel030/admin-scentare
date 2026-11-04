-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 10, 2026 at 01:16 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `perfume_ordering`
--

-- --------------------------------------------------------

--
-- Table structure for table `addresses`
--

CREATE TABLE `addresses` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `phone` varchar(255) NOT NULL,
  `line1` varchar(255) NOT NULL,
  `city` varchar(255) NOT NULL,
  `province` varchar(255) NOT NULL,
  `postal_code` varchar(255) NOT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `actor_id` bigint(20) UNSIGNED DEFAULT NULL,
  `actor_name` varchar(255) NOT NULL,
  `module` varchar(80) NOT NULL,
  `action` varchar(255) NOT NULL,
  `details` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `activity_logs_created_at_index` (`created_at`),
  KEY `activity_logs_actor_name_index` (`actor_name`),
  KEY `activity_logs_module_index` (`module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cart_items`
--

CREATE TABLE `cart_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `quantity` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Floral', 'floral', 'Soft and romantic fragrances featuring rose, jasmine, and other blooms.', '2026-09-30 05:57:05', '2026-09-30 05:57:05'),
(2, 'Woody', 'woody', 'Warm and sophisticated fragrances built around sandalwood, cedar, and oud.', '2026-09-30 05:57:05', '2026-09-30 05:57:05'),
(3, 'Fresh & Citrus', 'fresh-citrus', 'Crisp, energizing fragrances perfect for every day.', '2026-09-30 05:57:05', '2026-09-30 05:57:05'),
(4, 'Oriental', 'oriental', 'Rich, warm, and seductive fragrances.', '2026-09-30 05:57:05', '2026-09-30 05:57:05'),
(5, 'Gourmand', 'gourmand', 'Sweet fragrances layered with vanilla, caramel, and spices.', '2026-09-30 05:57:05', '2026-09-30 05:57:05'),
(6, 'Unisex', 'unisex', 'Versatile fragrances that suit everyone.', '2026-09-30 05:57:05', '2026-09-30 05:57:05');

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(4, '2026_09_03_134456_add_role_and_phone_to_users_table', 1),
(5, '2026_09_03_134458_create_addresses_table', 1),
(6, '2026_09_03_134458_create_categories_table', 1),
(7, '2026_09_03_134458_create_products_table', 1),
(8, '2026_09_03_134459_create_cart_items_table', 1),
(9, '2026_09_03_134500_create_orders_table', 1),
(10, '2026_09_03_134501_create_order_items_table', 1),
(11, '2026_09_14_072556_create_reviews_table', 1),
(12, '2026_09_14_072556_create_wishlist_items_table', 1),
(13, '2026_09_28_114432_create_notifications_table', 1),
(14, '2026_09_28_114433_add_delivery_fields_to_orders_table', 1),
(15, '2026_09_28_114434_create_order_issues_table', 1),
(16, '2026_09_28_114434_create_order_status_logs_table', 1),
(17, '2026_09_28_124232_add_delivery_role_and_rider_assignment', 1),
(18, '2026_09_30_124825_add_rider_live_location_to_orders_table', 1),
(19, '2026_10_07_115745_create_personal_access_tokens_table', 2),
(20, '2026_10_07_115829_add_proof_photo_to_orders_table', 2);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` char(36) NOT NULL,
  `type` varchar(255) NOT NULL,
  `notifiable_type` varchar(255) NOT NULL,
  `notifiable_id` bigint(20) UNSIGNED NOT NULL,
  `data` text NOT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `admin_notification_settings`
--

CREATE TABLE `admin_notification_settings` (
  `id` tinyint(3) UNSIGNED NOT NULL,
  `order_confirmation` tinyint(1) NOT NULL DEFAULT 1,
  `shipping_updates` tinyint(1) NOT NULL DEFAULT 1,
  `back_in_stock` tinyint(1) NOT NULL DEFAULT 1,
  `abandoned_cart` tinyint(1) NOT NULL DEFAULT 0,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `admin_notification_settings` (`id`, `order_confirmation`, `shipping_updates`, `back_in_stock`, `abandoned_cart`) VALUES (1, 1, 1, 1, 0);

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

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `type`, `notifiable_type`, `notifiable_id`, `data`, `read_at`, `created_at`, `updated_at`) VALUES
('0507acd8-5875-4c15-b3ac-87080ca5ea1b', 'App\\Notifications\\OrderStatusUpdated', 'App\\Models\\User', 9, '{\"order_id\":2,\"order_number\":\"SC-20261008-280119\",\"status\":\"confirmed\",\"message\":\"Your order has been confirmed and is being prepared.\"}', NULL, '2026-10-08 03:28:54', '2026-10-08 03:28:54'),
('349fffef-14c4-44a3-8369-dcaefa6e7b68', 'App\\Notifications\\OrderStatusUpdated', 'App\\Models\\User', 9, '{\"order_id\":2,\"order_number\":\"SC-20261008-280119\",\"status\":\"out_for_delivery\",\"message\":\"Your order is out for delivery \\u2014 expect it today.\"}', NULL, '2026-10-08 03:29:17', '2026-10-08 03:29:17'),
('3b2d609f-a664-420e-a235-42c4c1914cc1', 'App\\Notifications\\OrderStatusUpdated', 'App\\Models\\User', 9, '{\"order_id\":2,\"order_number\":\"SC-20261008-280119\",\"status\":\"shipped\",\"message\":\"Your order has shipped.\"}', '2026-10-08 03:30:10', '2026-10-08 03:28:54', '2026-10-08 03:30:10'),
('46d51482-065c-493b-a1a2-7d70f03b279b', 'App\\Notifications\\OrderStatusUpdated', 'App\\Models\\User', 9, '{\"order_id\":2,\"order_number\":\"SC-20261008-280119\",\"status\":\"preparing\",\"message\":\"We\'re preparing your order.\"}', NULL, '2026-10-08 03:28:54', '2026-10-08 03:28:54'),
('6524d30e-2b08-48ad-ade1-5ffe872ab965', 'App\\Notifications\\OrderStatusUpdated', 'App\\Models\\User', 9, '{\"order_id\":2,\"order_number\":\"SC-20261008-280119\",\"status\":\"packed\",\"message\":\"Your order is packed and ready for courier pickup.\"}', NULL, '2026-10-08 03:28:54', '2026-10-08 03:28:54'),
('6b0cf046-9854-448c-ba41-aa5649740a66', 'App\\Notifications\\OrderStatusUpdated', 'App\\Models\\User', 9, '{\"order_id\":2,\"order_number\":\"SC-20261008-280119\",\"status\":\"delivered\",\"message\":\"Your order has been delivered. Enjoy!\"}', '2026-10-08 03:30:03', '2026-10-08 03:29:33', '2026-10-08 03:30:03'),
('a43bdaca-8fdf-4770-b071-76487716623d', 'App\\Notifications\\OrderStatusUpdated', 'App\\Models\\User', 2, '{\"order_id\":1,\"order_number\":\"SC-20261007-46B008\",\"status\":\"out_for_delivery\",\"message\":\"Your order is out for delivery \\u2014 expect it today.\"}', NULL, '2026-10-07 04:08:25', '2026-10-07 04:08:25');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_number` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `phone` varchar(255) NOT NULL,
  `line1` varchar(255) NOT NULL,
  `city` varchar(255) NOT NULL,
  `province` varchar(255) NOT NULL,
  `postal_code` varchar(255) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `shipping_fee` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL,
  `payment_method` enum('cod','online') NOT NULL DEFAULT 'cod',
  `payment_status` enum('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  `status` enum('pending','confirmed','preparing','packed','shipped','out_for_delivery','delivered','failed_delivery','returned_to_sender','cancelled') NOT NULL DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `is_gift` tinyint(1) NOT NULL DEFAULT 0,
  `recipient_name` varchar(255) DEFAULT NULL,
  `recipient_phone` varchar(255) DEFAULT NULL,
  `gift_message` text DEFAULT NULL,
  `delivery_instructions` text DEFAULT NULL,
  `is_fragile` tinyint(1) NOT NULL DEFAULT 1,
  `preferred_delivery_date` date DEFAULT NULL,
  `rider_name` varchar(255) DEFAULT NULL,
  `rider_phone` varchar(255) DEFAULT NULL,
  `rider_id` bigint(20) UNSIGNED DEFAULT NULL,
  `rider_lat` decimal(10,7) DEFAULT NULL,
  `rider_lng` decimal(10,7) DEFAULT NULL,
  `rider_location_at` timestamp NULL DEFAULT NULL,
  `delivery_lat` decimal(10,7) DEFAULT NULL,
  `delivery_lng` decimal(10,7) DEFAULT NULL,
  `out_for_delivery_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `proof_photo` varchar(255) DEFAULT NULL,
  `estimated_delivery_minutes` int(10) UNSIGNED NOT NULL DEFAULT 180,
  `failed_delivery_reason` varchar(255) DEFAULT NULL,
  `delivery_rating` tinyint(3) UNSIGNED DEFAULT NULL,
  `delivery_feedback` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `order_number`, `user_id`, `full_name`, `phone`, `line1`, `city`, `province`, `postal_code`, `subtotal`, `shipping_fee`, `total`, `payment_method`, `payment_status`, `status`, `notes`, `is_gift`, `recipient_name`, `recipient_phone`, `gift_message`, `delivery_instructions`, `is_fragile`, `preferred_delivery_date`, `rider_name`, `rider_phone`, `rider_id`, `rider_lat`, `rider_lng`, `rider_location_at`, `delivery_lat`, `delivery_lng`, `out_for_delivery_at`, `delivered_at`, `proof_photo`, `estimated_delivery_minutes`, `failed_delivery_reason`, `delivery_rating`, `delivery_feedback`, `created_at`, `updated_at`) VALUES
(2, 'SC-20261008-280119', 9, 'Immanuel S. Siyasat', '09685993474', 'P. Riñoza Street', 'Nasugbu', 'Batangas', '4231', 1450.00, 120.00, 1570.00, 'cod', 'pending', 'delivered', 'yoww', 0, NULL, NULL, NULL, 'Katapat ng malaking blue na bahay', 1, '2026-10-10', 'Ramon P.', '0928 555 1122', 3, NULL, NULL, NULL, 14.0664490, 120.6327337, '2026-10-08 03:29:17', '2026-10-08 03:29:33', 'proof-photos/KbqKibZ9MGWQl9AKqFX93xhjso2GqXCt9f2H3ALW.jpg', 180, NULL, 5, 'bango', '2026-10-08 03:25:54', '2026-10-08 03:29:59');

-- --------------------------------------------------------

--
-- Table structure for table `order_issues`
--

CREATE TABLE `order_issues` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `order_item_id` bigint(20) UNSIGNED DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `type` enum('damaged','wrong_item','missing_item','other') NOT NULL DEFAULT 'damaged',
  `description` text NOT NULL,
  `photo_path` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected','refunded') NOT NULL DEFAULT 'pending',
  `admin_note` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED DEFAULT NULL,
  `product_name` varchar(255) NOT NULL,
  `product_image` varchar(255) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `quantity` int(10) UNSIGNED NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `product_image`, `price`, `quantity`, `subtotal`, `created_at`, `updated_at`) VALUES
(2, 2, 1, 'Velvet Rose', 'https://images.unsplash.com/photo-1595425959632-34f2822322ce?crop=entropy&cs=tinysrgb&fit=crop&w=900&h=900&q=80', 1450.00, 1, 1450.00, '2026-10-08 03:25:54', '2026-10-08 03:25:54');

-- --------------------------------------------------------

--
-- Table structure for table `order_status_logs`
--

CREATE TABLE `order_status_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `status` varchar(255) NOT NULL,
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_status_logs`
--

INSERT INTO `order_status_logs` (`id`, `order_id`, `status`, `note`, `created_at`) VALUES
(3, 2, 'pending', 'Order placed by customer.', '2026-10-08 11:25:54'),
(4, 2, 'confirmed', NULL, '2026-10-08 11:28:54'),
(5, 2, 'preparing', NULL, '2026-10-08 11:28:54'),
(6, 2, 'packed', NULL, '2026-10-08 11:28:54'),
(7, 2, 'shipped', NULL, '2026-10-08 11:28:54'),
(8, 2, 'out_for_delivery', NULL, '2026-10-08 11:29:17'),
(9, 2, 'delivered', NULL, '2026-10-08 11:29:33');

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 'App\\Models\\User', 3, 'rider-app', 'e1d470e7a7f8d34393bef9264a780773a707915074797318466437a152c21cf7', '[\"*\"]', '2026-10-07 04:00:34', NULL, '2026-10-07 04:00:27', '2026-10-07 04:00:34'),
(2, 'App\\Models\\User', 3, 'rider-app', '2404981c4b2f9b3618708b76ab6af43dd38afcee6c888db5d7345937da89a100', '[\"*\"]', NULL, NULL, '2026-10-07 04:08:09', '2026-10-07 04:08:09'),
(3, 'App\\Models\\User', 3, 'rider-app', '468547122f9227b2e991bbb81468d5579c3581771aea8d7336fc1c6ef6695b22', '[\"*\"]', '2026-10-07 04:08:26', NULL, '2026-10-07 04:08:16', '2026-10-07 04:08:26'),
(4, 'App\\Models\\User', 3, 'rider-app', '6bf25c8bf586e782fabcd54249c05c932b0b339916d4bb78b58ee0e4bf2a041b', '[\"*\"]', NULL, NULL, '2026-10-07 04:08:58', '2026-10-07 04:08:58'),
(5, 'App\\Models\\User', 3, 'rider-app', '63704de3b35ef71917d06581965c772064525c346c6878333de950086fbed70c', '[\"*\"]', '2026-10-08 04:47:25', NULL, '2026-10-07 04:27:03', '2026-10-08 04:47:25'),
(6, 'App\\Models\\User', 3, 'rider-app', '105fd3b09c38314e2bebd0a20b5d95ee1461dc41ee46f3bef72585556efa9c72', '[\"*\"]', NULL, NULL, '2026-10-08 03:27:01', '2026-10-08 03:27:01'),
(7, 'App\\Models\\User', 3, 'rider-app', 'cedbef1965e7a92a1c86b837e4be13b3e2f0d7273ca9d5fc31b5eeae4431832b', '[\"*\"]', '2026-10-08 03:28:59', NULL, '2026-10-08 03:28:58', '2026-10-08 03:28:59');

-- --------------------------------------------------------

--
-- Table structure for table `promotions`
--

CREATE TABLE `promotions` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(160) NOT NULL,
  `code` varchar(40) NOT NULL,
  `discount_type` enum('percentage','fixed','bundle') NOT NULL DEFAULT 'percentage',
  `discount_value` decimal(10,2) NOT NULL,
  `buy_quantity` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `usage_limit` int(10) UNSIGNED DEFAULT NULL,
  `usage_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `starts_at` datetime NOT NULL,
  `ends_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `promotions_code_unique` (`code`),
  KEY `promotions_active_dates_index` (`is_active`,`starts_at`,`ends_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `category_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `brand` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `top_notes` varchar(255) DEFAULT NULL,
  `middle_notes` varchar(255) DEFAULT NULL,
  `base_notes` varchar(255) DEFAULT NULL,
  `size_ml` int(10) UNSIGNED DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `stock` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `image` varchar(255) DEFAULT NULL,
  `is_featured` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `brand`, `description`, `top_notes`, `middle_notes`, `base_notes`, `size_ml`, `price`, `stock`, `image`, `is_featured`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 'Velvet Rose', 'velvet-rose', 'Scentare', 'Velvet Rose is a Floral fragrance blending Bergamot, Pink Pepper, Rose, Peony, and Musk, Amber. Perfect for everyday wear or a special occasion.', 'Bergamot, Pink Pepper', 'Rose, Peony', 'Musk, Amber', 50, 1450.00, 23, 'https://images.unsplash.com/photo-1595425959632-34f2822322ce?crop=entropy&cs=tinysrgb&fit=crop&w=900&h=900&q=80', 1, 1, '2026-09-30 05:57:05', '2026-10-08 03:25:54'),
(2, 1, 'Jasmine Noir', 'jasmine-noir', 'Scentare', 'Jasmine Noir is a Floral fragrance blending Mandarin, Bergamot, Jasmine, Ylang-Ylang, and Sandalwood, Vanilla. Perfect for everyday wear or a special occasion.', 'Mandarin, Bergamot', 'Jasmine, Ylang-Ylang', 'Sandalwood, Vanilla', 50, 1600.00, 18, 'https://images.unsplash.com/photo-1543422655-ac1c6ca993ed?crop=entropy&cs=tinysrgb&fit=crop&w=900&h=900&q=80', 0, 1, '2026-09-30 05:57:05', '2026-09-30 05:57:05'),
(3, 1, 'White Peony', 'white-peony', 'Maison Blume', 'White Peony is a Floral fragrance blending Lychee, Freesia, Peony, Lily of the Valley, and White Musk. Perfect for everyday wear or a special occasion.', 'Lychee, Freesia', 'Peony, Lily of the Valley', 'White Musk', 30, 990.00, 30, 'https://images.unsplash.com/photo-1458538977777-0549b2370168?crop=entropy&cs=tinysrgb&fit=crop&w=900&h=900&q=80', 0, 1, '2026-09-30 05:57:05', '2026-09-30 05:57:05'),
(4, 2, 'Amber Oud', 'amber-oud', 'Scentare', 'Amber Oud is a Woody fragrance blending Saffron, Cardamom, Oud, Rose, and Amber, Leather. Perfect for everyday wear or a special occasion.', 'Saffron, Cardamom', 'Oud, Rose', 'Amber, Leather', 50, 2450.00, 15, 'https://images.unsplash.com/photo-1733660227163-01bc46e0d7d7?crop=entropy&cs=tinysrgb&fit=crop&w=900&h=900&q=80', 1, 1, '2026-09-30 05:57:05', '2026-09-30 05:57:05'),
(5, 2, 'Cedar & Smoke', 'cedar-smoke', 'Nordvelt', 'Cedar & Smoke is a Woody fragrance blending Black Pepper, Bergamot, Cedarwood, Vetiver, and Smoked Oak, Musk. Perfect for everyday wear or a special occasion.', 'Black Pepper, Bergamot', 'Cedarwood, Vetiver', 'Smoked Oak, Musk', 100, 2100.00, 12, 'https://images.unsplash.com/photo-1705899844877-81bb0a0665c1?crop=entropy&cs=tinysrgb&fit=crop&w=900&h=900&q=80', 1, 1, '2026-09-30 05:57:05', '2026-09-30 05:57:05'),
(6, 2, 'Sandalwood Reverie', 'sandalwood-reverie', 'Scentare', 'Sandalwood Reverie is a Woody fragrance blending Cinnamon, Orange, Sandalwood, Iris, and Tonka Bean. Perfect for everyday wear or a special occasion.', 'Cinnamon, Orange', 'Sandalwood, Iris', 'Tonka Bean', 50, 1750.00, 20, 'https://images.unsplash.com/photo-1707539159855-d1cd485fe505?crop=entropy&cs=tinysrgb&fit=crop&w=900&h=900&q=80', 0, 1, '2026-09-30 05:57:05', '2026-09-30 05:57:05'),
(7, 3, 'Citrus Breeze', 'citrus-breeze', 'Maison Blume', 'Citrus Breeze is a Fresh & Citrus fragrance blending Lemon, Grapefruit, Neroli, Mint, and White Musk, Cedar. Perfect for everyday wear or a special occasion.', 'Lemon, Grapefruit', 'Neroli, Mint', 'White Musk, Cedar', 50, 1150.00, 35, 'https://images.unsplash.com/photo-1774682060959-efe13b7a12b9?crop=entropy&cs=tinysrgb&fit=crop&w=900&h=900&q=80', 1, 1, '2026-09-30 05:57:05', '2026-09-30 05:57:05'),
(8, 3, 'Ocean Mist', 'ocean-mist', 'Nordvelt', 'Ocean Mist is a Fresh & Citrus fragrance blending Sea Salt, Bergamot, Marine Accord, Lavender, and Driftwood, Musk. Perfect for everyday wear or a special occasion.', 'Sea Salt, Bergamot', 'Marine Accord, Lavender', 'Driftwood, Musk', 100, 1350.00, 28, 'https://images.unsplash.com/photo-1723391962241-7078664ec669?crop=entropy&cs=tinysrgb&fit=crop&w=900&h=900&q=80', 0, 1, '2026-09-30 05:57:05', '2026-09-30 05:57:05'),
(9, 3, 'Bergamot Sun', 'bergamot-sun', 'Scentare', 'Bergamot Sun is a Fresh & Citrus fragrance blending Bergamot, Yuzu, Green Tea, Fig, and Cedar, Amber. Perfect for everyday wear or a special occasion.', 'Bergamot, Yuzu', 'Green Tea, Fig', 'Cedar, Amber', 30, 850.00, 40, 'https://images.unsplash.com/photo-1774682060922-c395859148c9?crop=entropy&cs=tinysrgb&fit=crop&w=900&h=900&q=80', 0, 1, '2026-09-30 05:57:05', '2026-09-30 05:57:05'),
(10, 4, 'Spiced Vanilla', 'spiced-vanilla', 'Scentare', 'Spiced Vanilla is a Oriental fragrance blending Cinnamon, Clove, Vanilla, Amber, and Benzoin, Musk. Perfect for everyday wear or a special occasion.', 'Cinnamon, Clove', 'Vanilla, Amber', 'Benzoin, Musk', 50, 1550.00, 22, 'https://images.unsplash.com/photo-1733660227131-0fd47f7ad3ad?crop=entropy&cs=tinysrgb&fit=crop&w=900&h=900&q=80', 0, 1, '2026-09-30 05:57:05', '2026-09-30 05:57:05'),
(11, 4, 'Golden Musk', 'golden-musk', 'Maison Blume', 'Golden Musk is a Oriental fragrance blending Saffron, Pink Pepper, Oud, Rose, and Golden Amber, Musk. Perfect for everyday wear or a special occasion.', 'Saffron, Pink Pepper', 'Oud, Rose', 'Golden Amber, Musk', 50, 2250.00, 10, 'https://images.unsplash.com/photo-1733660227083-12b78ad0073d?crop=entropy&cs=tinysrgb&fit=crop&w=900&h=900&q=80', 1, 1, '2026-09-30 05:57:05', '2026-09-30 05:57:05'),
(12, 4, 'Midnight Ember', 'midnight-ember', 'Nordvelt', 'Midnight Ember is a Oriental fragrance blending Black Currant, Bergamot, Incense, Patchouli, and Leather, Amber. Perfect for everyday wear or a special occasion.', 'Black Currant, Bergamot', 'Incense, Patchouli', 'Leather, Amber', 100, 2600.00, 9, 'https://images.unsplash.com/photo-1615160460524-432433ba1b8f?crop=entropy&cs=tinysrgb&fit=crop&w=900&h=900&q=80', 0, 1, '2026-09-30 05:57:05', '2026-09-30 05:57:05'),
(13, 5, 'Caramel Dust', 'caramel-dust', 'Scentare', 'Caramel Dust is a Gourmand fragrance blending Almond, Bergamot, Caramel, Praline, and Vanilla, Tonka Bean. Perfect for everyday wear or a special occasion.', 'Almond, Bergamot', 'Caramel, Praline', 'Vanilla, Tonka Bean', 50, 1400.00, 26, 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?crop=entropy&cs=tinysrgb&fit=crop&w=900&h=900&q=80', 0, 1, '2026-09-30 05:57:05', '2026-09-30 05:57:05'),
(14, 5, 'Honey Fig', 'honey-fig', 'Maison Blume', 'Honey Fig is a Gourmand fragrance blending Fig Leaf, Pear, Honey, Jasmine, and Sandalwood, Musk. Perfect for everyday wear or a special occasion.', 'Fig Leaf, Pear', 'Honey, Jasmine', 'Sandalwood, Musk', 50, 1500.00, 16, 'https://images.unsplash.com/photo-1775344539311-7066eb548c68?crop=entropy&cs=tinysrgb&fit=crop&w=900&h=900&q=80', 0, 1, '2026-09-30 05:57:05', '2026-09-30 05:57:05'),
(15, 6, 'Skin Musk', 'skin-musk', 'Nordvelt', 'Skin Musk is a Unisex fragrance blending Bergamot, Pink Pepper, White Musk, Iris, and Cedar, Ambroxan. Perfect for everyday wear or a special occasion.', 'Bergamot, Pink Pepper', 'White Musk, Iris', 'Cedar, Ambroxan', 100, 1950.00, 20, 'https://images.unsplash.com/photo-1774682060997-f8959850a7d4?crop=entropy&cs=tinysrgb&fit=crop&w=900&h=900&q=80', 1, 1, '2026-09-30 05:57:05', '2026-09-30 05:57:05'),
(16, 6, 'Grey Vetiver', 'grey-vetiver', 'Scentare', 'Grey Vetiver is a Unisex fragrance blending Grapefruit, Vetiver, Nutmeg, Iris, and Sandalwood, Musk. Perfect for everyday wear or a special occasion.', 'Grapefruit, Vetiver', 'Nutmeg, Iris', 'Sandalwood, Musk', 100, 2050.00, 14, 'https://images.unsplash.com/photo-1774682060971-7b0b07c1d47f?crop=entropy&cs=tinysrgb&fit=crop&w=900&h=900&q=80', 0, 1, '2026-09-30 05:57:05', '2026-09-30 05:57:05'),
(17, 6, 'Suede Noir', 'suede-noir', 'Nordvelt', 'Suede Noir is a Unisex fragrance blending Cardamom, Bergamot, Suede, Iris, and Vetiver, Amber. Perfect for everyday wear or a special occasion.', 'Cardamom, Bergamot', 'Suede, Iris', 'Vetiver, Amber', 50, 1850.00, 17, 'https://images.unsplash.com/photo-1774682060992-46c7e9f2e50b?crop=entropy&cs=tinysrgb&fit=crop&w=900&h=900&q=80', 0, 1, '2026-09-30 05:57:05', '2026-09-30 05:57:05');

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `rating` tinyint(3) UNSIGNED NOT NULL,
  `comment` text DEFAULT NULL,
  `moderation_status` enum('pending','published','flagged','removed') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `reviews`
--

INSERT INTO `reviews` (`id`, `product_id`, `user_id`, `rating`, `comment`, `created_at`, `updated_at`) VALUES
(1, 1, 4, 4, 'Lasts the whole day and the rose never turns powdery — just soft and warm.', '2026-09-30 05:57:06', '2026-09-30 05:57:06'),
(2, 1, 6, 5, 'My signature scent na. Compliments palagi!', '2026-09-30 05:57:06', '2026-09-30 05:57:06'),
(3, 1, 8, 4, 'Subtle pero noticeable. Perfect for office wear.', '2026-09-30 05:57:06', '2026-09-30 05:57:06'),
(4, 4, 5, 5, 'Ordered on a Tuesday, arrived Thursday, no fuss. Packaging felt premium.', '2026-09-30 05:57:06', '2026-09-30 05:57:06'),
(5, 4, 7, 5, 'Mas maganda pa sa mas mahal na oud fragrances na natry ko.', '2026-09-30 05:57:06', '2026-09-30 05:57:06'),
(6, 4, 4, 3, 'Strong projection — sobra medyo para sa daytime use pero maganda for events.', '2026-09-30 05:57:06', '2026-09-30 05:57:06'),
(7, 7, 8, 5, 'Sobrang fresh, parang shower pa rin effect the whole day.', '2026-09-30 05:57:06', '2026-09-30 05:57:06'),
(8, 7, 6, 4, 'Great for gym days. Wish it lasted a bit longer though.', '2026-09-30 05:57:06', '2026-09-30 05:57:06'),
(9, 11, 7, 5, 'Unisex talaga siya, pati girlfriend ko gustong gamitin.', '2026-09-30 05:57:06', '2026-09-30 05:57:06'),
(10, 11, 5, 4, 'Warm at sophisticated. Good for dates.', '2026-09-30 05:57:06', '2026-09-30 05:57:06'),
(11, 12, 6, 5, 'Skeptical ako sa online perfume shopping pero legit pala. Go-to ko na ito for date nights.', '2026-09-30 05:57:06', '2026-09-30 05:57:06'),
(12, 12, 4, 5, 'Sultry and bold, hindi mawala buong gabi.', '2026-09-30 05:57:06', '2026-09-30 05:57:06'),
(13, 12, 7, 4, 'Smoky at may leather note, perfect for after-dark events.', '2026-09-30 05:57:06', '2026-09-30 05:57:06'),
(14, 5, 5, 4, 'Masculine and grounded scent, sulit sa presyo.', '2026-09-30 05:57:06', '2026-09-30 05:57:06'),
(15, 2, 8, 5, 'Floral pero hindi cloying, maganda ang sillage.', '2026-09-30 05:57:06', '2026-09-30 05:57:06'),
(16, 14, 4, 4, 'Sweet without being sticky. Nice for cooler evenings.', '2026-09-30 05:57:06', '2026-09-30 05:57:06');

UPDATE `reviews` SET `moderation_status` = 'published';

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES
('DjsLEWBC1TCYOG1IhUAYxossL9sSS9EaTEnoE0IF', NULL, '127.0.0.1', 'curl/8.21.0', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoid21vWk9PMmdrS0RubkpPd0kzQWFMTnJSaEZ1dXhXV1I1QnkyY04xQiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMCI7czo1OiJyb3V0ZSI7czo0OiJob21lIjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1791458804),
('RrzdHKkFtIlKLEBU2RBNUqTEIaKBxLWISF0TBuxi', 9, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36', 'YTo0OntzOjY6Il90b2tlbiI7czo0MDoiREtuTXNyWFZXR0M2cEZaaUdNSHo4MmhueHBIaVJVOEZTQ1VHTms5ZiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzU6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9vcmRlcnMvMi9saXZlIjtzOjU6InJvdXRlIjtzOjExOiJvcmRlcnMubGl2ZSI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fXM6NTA6ImxvZ2luX3dlYl81OWJhMzZhZGRjMmIyZjk0MDE1ODBmMDE0YzdmNThlYTRlMzA5ODlkIjtpOjk7fQ==', 1791463645);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `role` enum('customer','admin','delivery') NOT NULL DEFAULT 'customer',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `phone` varchar(255) DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `role`, `phone`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'Scentare Admin', 'admin@scentare.test', 'admin', NULL, '2026-09-30 05:57:05', '$2y$12$fTd2DgSc1QWtB8jCowvogOn3SvUGIG5FBeuP76OaXqliox6LdFlNG', NULL, '2026-09-30 05:57:05', '2026-09-30 05:57:05'),
(2, 'Juan Dela Cruz', 'customer@scentare.test', 'customer', NULL, '2026-09-30 05:57:05', '$2y$12$HOFzsODho9k6QG64e0Rh9us5MPGz8eIZ6656bi22icblq8Dvl3pKq', NULL, '2026-09-30 05:57:05', '2026-09-30 05:57:05'),
(3, 'Ramon P.', 'rider@scentare.test', 'delivery', '0928 555 1122', '2026-09-30 05:57:05', '$2y$12$HJScrjsOonGD0QAyeebIhuJ/b5JhHJc6ywcx6zYxhtFzEk8XIaxsy', NULL, '2026-09-30 05:57:05', '2026-09-30 05:57:05'),
(4, 'Andrea M.', 'andrea.m@scentare.test', 'customer', NULL, '2026-09-30 05:57:06', '$2y$12$1z3e0X8pg3gOsv7lQayxAOQqpfZyJ9Ufrq8j7rmK1U.DgdeLFpNMq', NULL, '2026-09-30 05:57:06', '2026-09-30 05:57:06'),
(5, 'Miguel S.', 'miguel.s@scentare.test', 'customer', NULL, '2026-09-30 05:57:06', '$2y$12$hO/EbET04RNvdrGkFS04XeE/K3QqOJ0bJUusKb2zH4Co5Q6x4PzfK', NULL, '2026-09-30 05:57:06', '2026-09-30 05:57:06'),
(6, 'Kaye R.', 'kaye.r@scentare.test', 'customer', NULL, '2026-09-30 05:57:06', '$2y$12$qok2YCB8C7hVZTClpnMIXujtNGxnUxYg6w7FAoHJHsDWWU.X1sneW', NULL, '2026-09-30 05:57:06', '2026-09-30 05:57:06'),
(7, 'Paolo T.', 'paolo.t@scentare.test', 'customer', NULL, '2026-09-30 05:57:06', '$2y$12$qda0zgfT7Vo90bXoGAwWJO73/HUpN7JwfRC1iEdmbrJOquhVItQye', NULL, '2026-09-30 05:57:06', '2026-09-30 05:57:06'),
(8, 'Liza G.', 'liza.g@scentare.test', 'customer', NULL, '2026-09-30 05:57:06', '$2y$12$CqTjaVkUbZyyev2KRqERu.8JiI0bHuFqxmotYshSJl/KAskS92T8u', NULL, '2026-09-30 05:57:06', '2026-09-30 05:57:06'),
(9, 'Immanuel S. Siyasat', 'siyasatimmanuel30@gmail.com', 'customer', NULL, NULL, '$2y$12$r871XqjFnenpo78lbdL.9ejzXREJZVKpfzJWap7euE.KG24BCEzSK', NULL, '2026-10-08 03:24:11', '2026-10-08 03:24:11');

-- --------------------------------------------------------

--
-- Table structure for table `wishlist_items`
--

CREATE TABLE `wishlist_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `addresses`
--
ALTER TABLE `addresses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `addresses_user_id_foreign` (`user_id`);

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_expiration_index` (`expiration`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_locks_expiration_index` (`expiration`);

--
-- Indexes for table `cart_items`
--
ALTER TABLE `cart_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `cart_items_user_id_product_id_unique` (`user_id`,`product_id`),
  ADD KEY `cart_items_product_id_foreign` (`product_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `categories_slug_unique` (`slug`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notifications_notifiable_type_notifiable_id_index` (`notifiable_type`,`notifiable_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `orders_order_number_unique` (`order_number`),
  ADD KEY `orders_user_id_foreign` (`user_id`),
  ADD KEY `orders_rider_id_foreign` (`rider_id`);

--
-- Indexes for table `order_issues`
--
ALTER TABLE `order_issues`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_issues_order_id_foreign` (`order_id`),
  ADD KEY `order_issues_order_item_id_foreign` (`order_item_id`),
  ADD KEY `order_issues_user_id_foreign` (`user_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_items_order_id_foreign` (`order_id`),
  ADD KEY `order_items_product_id_foreign` (`product_id`);

--
-- Indexes for table `order_status_logs`
--
ALTER TABLE `order_status_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_status_logs_order_id_foreign` (`order_id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  ADD KEY `personal_access_tokens_expires_at_index` (`expires_at`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `products_slug_unique` (`slug`),
  ADD KEY `products_category_id_foreign` (`category_id`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `reviews_product_id_user_id_unique` (`product_id`,`user_id`),
  ADD KEY `reviews_user_id_foreign` (`user_id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

--
-- Indexes for table `wishlist_items`
--
ALTER TABLE `wishlist_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `wishlist_items_user_id_product_id_unique` (`user_id`,`product_id`),
  ADD KEY `wishlist_items_product_id_foreign` (`product_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `addresses`
--
ALTER TABLE `addresses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `cart_items`
--
ALTER TABLE `cart_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `order_issues`
--
ALTER TABLE `order_issues`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `order_status_logs`
--
ALTER TABLE `order_status_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `wishlist_items`
--
ALTER TABLE `wishlist_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `addresses`
--
ALTER TABLE `addresses`
  ADD CONSTRAINT `addresses_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `cart_items`
--
ALTER TABLE `cart_items`
  ADD CONSTRAINT `cart_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cart_items_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_rider_id_foreign` FOREIGN KEY (`rider_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `orders_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `order_issues`
--
ALTER TABLE `order_issues`
  ADD CONSTRAINT `order_issues_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_issues_order_item_id_foreign` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `order_issues_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `order_status_logs`
--
ALTER TABLE `order_status_logs`
  ADD CONSTRAINT `order_status_logs_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reviews_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `wishlist_items`
--
ALTER TABLE `wishlist_items`
  ADD CONSTRAINT `wishlist_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `wishlist_items_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
