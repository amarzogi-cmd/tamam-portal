CREATE TABLE `field_visits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`scheduledDate` timestamp,
	`scheduledTime` varchar(10),
	`teamMembers` text,
	`scheduleNotes` text,
	`scheduledBy` int,
	`scheduledAt` timestamp,
	`executionDate` timestamp,
	`executionTime` varchar(10),
	`attendees` text,
	`executionNotes` text,
	`executedBy` int,
	`executedAt` timestamp,
	`reportSubmitted` boolean DEFAULT false,
	`reportSubmittedBy` int,
	`reportSubmittedAt` timestamp,
	`status` enum('scheduled','executed','reported','completed') DEFAULT 'scheduled',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `field_visits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `field_visits` ADD CONSTRAINT `field_visits_requestId_mosque_requests_id_fk` FOREIGN KEY (`requestId`) REFERENCES `mosque_requests`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `field_visits` ADD CONSTRAINT `field_visits_scheduledBy_users_id_fk` FOREIGN KEY (`scheduledBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `field_visits` ADD CONSTRAINT `field_visits_executedBy_users_id_fk` FOREIGN KEY (`executedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `field_visits` ADD CONSTRAINT `field_visits_reportSubmittedBy_users_id_fk` FOREIGN KEY (`reportSubmittedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;