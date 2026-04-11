CREATE TABLE `api_token_records` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`summary` text NOT NULL,
	`scopes` text DEFAULT '[]' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`expires_at` integer,
	`revoked_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_api_token_records_user_id` ON `api_token_records` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_api_token_records_token_hash` ON `api_token_records` (`token_hash`);