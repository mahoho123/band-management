CREATE TABLE `band_attendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`memberId` int NOT NULL,
	`status` enum('going','not-going','pending') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `band_attendance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `band_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`date` varchar(10) NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`endTime` varchar(5) NOT NULL,
	`location` varchar(255) NOT NULL,
	`type` enum('rehearsal','performance','meeting','other') NOT NULL,
	`notes` text,
	`isCompleted` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `band_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `band_holidays` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`name` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `band_holidays_id` PRIMARY KEY(`id`),
	CONSTRAINT `band_holidays_date_unique` UNIQUE(`date`)
);
--> statement-breakpoint
CREATE TABLE `band_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`instrument` varchar(255),
	`color` varchar(50) NOT NULL DEFAULT 'blue',
	`password` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `band_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `band_system_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminPassword` varchar(255) NOT NULL,
	`isSetup` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `band_system_data_id` PRIMARY KEY(`id`)
);
