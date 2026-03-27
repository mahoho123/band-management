CREATE TABLE `band_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`memberId` int NOT NULL,
	`type` enum('attendance-changed') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`isRead` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `band_notifications_id` PRIMARY KEY(`id`)
);
