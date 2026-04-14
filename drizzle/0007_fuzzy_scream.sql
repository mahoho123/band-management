ALTER TABLE `band_attendance` ADD CONSTRAINT `event_member_idx` UNIQUE(`eventId`,`memberId`);--> statement-breakpoint
CREATE INDEX `attendance_event_id_idx` ON `band_attendance` (`eventId`);--> statement-breakpoint
CREATE INDEX `events_date_idx` ON `band_events` (`date`);--> statement-breakpoint
CREATE INDEX `notifications_created_at_idx` ON `band_notifications` (`createdAt`);--> statement-breakpoint
CREATE INDEX `notifications_is_read_idx` ON `band_notifications` (`isRead`);--> statement-breakpoint
CREATE INDEX `push_subscriptions_user_id_idx` ON `push_subscriptions` (`userId`);