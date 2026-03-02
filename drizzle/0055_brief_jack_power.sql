CREATE TABLE `job_positions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nameAr` varchar(100) NOT NULL,
	`nameEn` varchar(100),
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `job_positions_id` PRIMARY KEY(`id`)
);
