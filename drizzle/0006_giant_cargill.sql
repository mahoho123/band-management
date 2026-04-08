ALTER TABLE `band_notifications` MODIFY COLUMN `eventId` int;--> statement-breakpoint
ALTER TABLE `band_notifications` MODIFY COLUMN `memberId` int;--> statement-breakpoint
ALTER TABLE `band_notifications` MODIFY COLUMN `type` enum('attendance-changed','event-added','event-updated','event-deleted','member-added','member-deleted','system') NOT NULL;