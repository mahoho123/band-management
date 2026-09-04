ALTER TABLE `band_attendance` DROP INDEX `event_member_idx`;--> statement-breakpoint
ALTER TABLE `band_holidays` DROP INDEX `band_holidays_date_unique`;--> statement-breakpoint
DROP INDEX `events_date_idx` ON `band_events`;--> statement-breakpoint
ALTER TABLE `band_attendance` ADD `bandId` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `band_events` ADD `bandId` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `band_holidays` ADD `bandId` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `band_members` ADD `bandId` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `band_notifications` ADD `bandId` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `band_system_data` ADD `bandId` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `push_subscriptions` ADD `bandId` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `band_attendance` ADD CONSTRAINT `event_member_idx` UNIQUE(`bandId`,`eventId`,`memberId`);--> statement-breakpoint
ALTER TABLE `band_holidays` ADD CONSTRAINT `band_holidays_band_date_idx` UNIQUE(`bandId`,`date`);--> statement-breakpoint
CREATE INDEX `band_members_band_idx` ON `band_members` (`bandId`);--> statement-breakpoint
CREATE INDEX `push_subscriptions_band_user_idx` ON `push_subscriptions` (`bandId`,`userId`);--> statement-breakpoint
CREATE INDEX `events_date_idx` ON `band_events` (`bandId`,`date`);