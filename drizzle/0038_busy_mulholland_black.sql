ALTER TABLE `request_stage_tracking` MODIFY COLUMN `startedAt` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `request_stage_tracking` MODIFY COLUMN `dueAt` timestamp;