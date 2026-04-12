CREATE TABLE `event_outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`event_type` text NOT NULL,
	`event_payload` text NOT NULL,
	`occurred_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`processed_at` integer
);
--> statement-breakpoint
CREATE INDEX `idx_event_outbox_pending` ON `event_outbox` (`processed_at`);--> statement-breakpoint
ALTER TABLE `users` ADD `time_format` text DEFAULT '24h' NOT NULL;