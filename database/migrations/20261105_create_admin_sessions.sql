CREATE TABLE IF NOT EXISTS `admin_sessions` (
  `id` varchar(128) NOT NULL,
  `data` mediumblob NOT NULL,
  `last_activity` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `admin_sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
