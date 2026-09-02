CREATE TABLE `band_memberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bandId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','admin','member') NOT NULL DEFAULT 'member',
	`status` enum('active','invited','suspended') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `band_memberships_id` PRIMARY KEY(`id`),
	CONSTRAINT `band_memberships_band_user_idx` UNIQUE(`bandId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `bands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(120) NOT NULL,
	`logoUrl` text,
	`primaryColor` varchar(32) NOT NULL DEFAULT '#D4A017',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bands_id` PRIMARY KEY(`id`),
	CONSTRAINT `bands_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE INDEX `band_memberships_user_idx` ON `band_memberships` (`userId`);--> statement-breakpoint
CREATE INDEX `bands_slug_idx` ON `bands` (`slug`);