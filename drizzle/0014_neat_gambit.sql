ALTER TABLE `band_notifications` ADD `status` enum('pending','acknowledged','dismissed') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `band_notifications` ADD `ackByDevice` varchar(255);--> statement-breakpoint
CREATE INDEX `notifications_status_idx` ON `band_notifications` (`status`);