-- Existing reviews stay published; new reviews default to pending approval.
ALTER TABLE `reviews`
  ADD COLUMN `moderation_status` enum('pending','published','flagged','removed') NOT NULL DEFAULT 'published' AFTER `comment`;

ALTER TABLE `reviews`
  MODIFY COLUMN `moderation_status` enum('pending','published','flagged','removed') NOT NULL DEFAULT 'pending';
