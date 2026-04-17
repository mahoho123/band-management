UPDATE `band_events` SET `startTime` = NULL WHERE `startTime` IS NOT NULL;--> statement-breakpoint
UPDATE `band_events` SET `endTime` = NULL WHERE `endTime` IS NOT NULL;--> statement-breakpoint
ALTER TABLE `band_events` MODIFY COLUMN `startTime` json;--> statement-breakpoint
ALTER TABLE `band_events` MODIFY COLUMN `endTime` json;
