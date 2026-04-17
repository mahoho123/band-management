ALTER TABLE `band_events` MODIFY COLUMN `startTime` varchar(5);--> statement-breakpoint
ALTER TABLE `band_events` MODIFY COLUMN `endTime` varchar(5);--> statement-breakpoint
ALTER TABLE `band_events` ADD `timeSlot` varchar(10);