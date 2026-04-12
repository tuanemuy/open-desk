CREATE TABLE `app_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`is_default` integer NOT NULL DEFAULT false,
	`created_at` integer NOT NULL DEFAULT (unixepoch()),
	`updated_at` integer NOT NULL DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE INDEX `idx_app_groups_is_default` ON `app_groups` (`is_default`);
--> statement-breakpoint
CREATE TABLE `app_group_apps` (
	`id` text PRIMARY KEY NOT NULL,
	`app_group_id` text NOT NULL,
	`app_id` text NOT NULL,
	`created_at` integer NOT NULL DEFAULT (unixepoch()),
	FOREIGN KEY (`app_group_id`) REFERENCES `app_groups`(`id`) ON DELETE cascade ON UPDATE no action,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_app_group_apps` ON `app_group_apps` (`app_group_id`,`app_id`);
--> statement-breakpoint
CREATE INDEX `idx_app_group_apps_app_group_id` ON `app_group_apps` (`app_group_id`);
--> statement-breakpoint
CREATE INDEX `idx_app_group_apps_app_id` ON `app_group_apps` (`app_id`);
--> statement-breakpoint
CREATE TABLE `app_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`source_app_id` text,
	`creator_id` text NOT NULL,
	`created_at` integer NOT NULL DEFAULT (unixepoch()),
	FOREIGN KEY (`source_app_id`) REFERENCES `apps`(`id`) ON DELETE set null ON UPDATE no action,
	FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX `idx_app_templates_creator_id` ON `app_templates` (`creator_id`);
--> statement-breakpoint
CREATE INDEX `idx_app_templates_source_app_id` ON `app_templates` (`source_app_id`);
--> statement-breakpoint
CREATE TABLE `audit_log_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`settings` text NOT NULL DEFAULT '{}',
	`created_at` integer NOT NULL DEFAULT (unixepoch()),
	`updated_at` integer NOT NULL DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`level` text NOT NULL,
	`timestamp` integer NOT NULL,
	`source_ip` text,
	`user_id` text,
	`service` text NOT NULL,
	`module` text NOT NULL,
	`action` text NOT NULL,
	`result` text NOT NULL,
	`error_code` text,
	`created_at` integer NOT NULL DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX `idx_audit_logs_timestamp` ON `audit_logs` (`timestamp`);
--> statement-breakpoint
CREATE INDEX `idx_audit_logs_level` ON `audit_logs` (`level`);
--> statement-breakpoint
CREATE INDEX `idx_audit_logs_user_id` ON `audit_logs` (`user_id`);
--> statement-breakpoint
CREATE INDEX `idx_audit_logs_service` ON `audit_logs` (`service`);
--> statement-breakpoint
CREATE INDEX `idx_audit_logs_result` ON `audit_logs` (`result`);
--> statement-breakpoint
CREATE INDEX `idx_audit_logs_timestamp_level` ON `audit_logs` (`timestamp`,`level`);
--> statement-breakpoint
CREATE TABLE `org_access_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`source_organization_id` text NOT NULL,
	`target_organization_id` text NOT NULL,
	`access_level` text NOT NULL DEFAULT 'FULL',
	`is_enabled` integer NOT NULL DEFAULT true,
	`created_at` integer NOT NULL DEFAULT (unixepoch()),
	`updated_at` integer NOT NULL DEFAULT (unixepoch()),
	FOREIGN KEY (`source_organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action,
	FOREIGN KEY (`target_organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_org_access_rules_pair` ON `org_access_rules` (`source_organization_id`,`target_organization_id`);
--> statement-breakpoint
CREATE INDEX `idx_org_access_rules_source` ON `org_access_rules` (`source_organization_id`);
--> statement-breakpoint
CREATE INDEX `idx_org_access_rules_target` ON `org_access_rules` (`target_organization_id`);
--> statement-breakpoint
CREATE INDEX `idx_org_access_rules_is_enabled` ON `org_access_rules` (`is_enabled`);
--> statement-breakpoint
CREATE TABLE `plugins` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`is_active` integer NOT NULL DEFAULT true,
	`is_preinstalled` integer NOT NULL DEFAULT false,
	`created_at` integer NOT NULL DEFAULT (unixepoch()),
	`updated_at` integer NOT NULL DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE INDEX `idx_plugins_is_active` ON `plugins` (`is_active`);
--> statement-breakpoint
CREATE INDEX `idx_plugins_is_preinstalled` ON `plugins` (`is_preinstalled`);
--> statement-breakpoint
CREATE TABLE `plugin_apps` (
	`id` text PRIMARY KEY NOT NULL,
	`plugin_id` text NOT NULL,
	`app_id` text NOT NULL,
	`created_at` integer NOT NULL DEFAULT (unixepoch()),
	FOREIGN KEY (`plugin_id`) REFERENCES `plugins`(`id`) ON DELETE cascade ON UPDATE no action,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_plugin_apps` ON `plugin_apps` (`plugin_id`,`app_id`);
--> statement-breakpoint
CREATE INDEX `idx_plugin_apps_plugin_id` ON `plugin_apps` (`plugin_id`);
--> statement-breakpoint
CREATE INDEX `idx_plugin_apps_app_id` ON `plugin_apps` (`app_id`);
--> statement-breakpoint
CREATE TABLE `provisioning_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`is_enabled` integer NOT NULL DEFAULT false,
	`bearer_token_hash` text,
	`bearer_token_algorithm` text,
	`token_issued_at` integer,
	`created_at` integer NOT NULL DEFAULT (unixepoch()),
	`updated_at` integer NOT NULL DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `scim_external_mappings` (
	`id` text PRIMARY KEY NOT NULL,
	`external_id` text NOT NULL,
	`resource_type` text NOT NULL,
	`internal_id` text NOT NULL,
	`created_at` integer NOT NULL DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_scim_external_mappings` ON `scim_external_mappings` (`external_id`,`resource_type`);
--> statement-breakpoint
CREATE INDEX `idx_scim_external_mappings_internal_id` ON `scim_external_mappings` (`internal_id`);
--> statement-breakpoint
CREATE INDEX `idx_scim_external_mappings_resource_type` ON `scim_external_mappings` (`resource_type`);
--> statement-breakpoint
CREATE TABLE `thread_actions` (
	`id` text PRIMARY KEY NOT NULL,
	`action_name` text NOT NULL,
	`destination_app_id` text NOT NULL,
	`field_mappings` text NOT NULL DEFAULT '[]',
	`modifier_id` text NOT NULL,
	`modified_at` integer NOT NULL DEFAULT (unixepoch()),
	`created_at` integer NOT NULL DEFAULT (unixepoch()),
	FOREIGN KEY (`destination_app_id`) REFERENCES `apps`(`id`) ON DELETE cascade ON UPDATE no action,
	FOREIGN KEY (`modifier_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX `idx_thread_actions_destination_app_id` ON `thread_actions` (`destination_app_id`);
--> statement-breakpoint
CREATE INDEX `idx_thread_actions_modifier_id` ON `thread_actions` (`modifier_id`);
--> statement-breakpoint
CREATE TABLE `titles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`order_index` integer NOT NULL DEFAULT 0,
	`created_at` integer NOT NULL DEFAULT (unixepoch()),
	`updated_at` integer NOT NULL DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE UNIQUE INDEX `titles_name_unique` ON `titles` (`name`);
--> statement-breakpoint
CREATE INDEX `idx_titles_name` ON `titles` (`name`);
--> statement-breakpoint
CREATE INDEX `idx_titles_order_index` ON `titles` (`order_index`);
--> statement-breakpoint
CREATE TABLE `user_access_dates` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`access_date` integer NOT NULL,
	`created_at` integer NOT NULL DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_user_access_dates` ON `user_access_dates` (`user_id`,`access_date`);
--> statement-breakpoint
CREATE INDEX `idx_user_access_dates_user_id_date` ON `user_access_dates` (`user_id`,`access_date`);
--> statement-breakpoint
CREATE INDEX `idx_user_access_dates_access_date` ON `user_access_dates` (`access_date`);
--> statement-breakpoint
CREATE TABLE `user_access_usages` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`last_access_date` integer,
	`access_days_last_30` integer NOT NULL DEFAULT 0,
	`created_at` integer NOT NULL DEFAULT (unixepoch()),
	`updated_at` integer NOT NULL DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_access_usages_user_id_unique` ON `user_access_usages` (`user_id`);
--> statement-breakpoint
CREATE INDEX `idx_user_access_usages_last_access_date` ON `user_access_usages` (`last_access_date`);
--> statement-breakpoint
CREATE INDEX `idx_user_access_usages_access_days` ON `user_access_usages` (`access_days_last_30`);
--> statement-breakpoint
CREATE TABLE `user_titles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title_id` text NOT NULL,
	`created_at` integer NOT NULL DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action,
	FOREIGN KEY (`title_id`) REFERENCES `titles`(`id`) ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_user_titles` ON `user_titles` (`user_id`,`title_id`);
--> statement-breakpoint
CREATE INDEX `idx_user_titles_user_id` ON `user_titles` (`user_id`);
--> statement-breakpoint
CREATE INDEX `idx_user_titles_title_id` ON `user_titles` (`title_id`);
