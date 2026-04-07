CREATE TABLE `api_token_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`app_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`scopes` text DEFAULT '[]' NOT NULL,
	`memo` text DEFAULT '' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_api_token_configs_app_id` ON `api_token_configs` (`app_id`);--> statement-breakpoint
CREATE INDEX `idx_api_token_configs_token_hash` ON `api_token_configs` (`token_hash`);--> statement-breakpoint
CREATE TABLE `app_acl_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`app_id` text NOT NULL,
	`priority` integer NOT NULL,
	`entity_type` text NOT NULL,
	`entity_code` text,
	`include_subs` integer DEFAULT false NOT NULL,
	`app_editable` integer DEFAULT false NOT NULL,
	`record_viewable` integer DEFAULT false NOT NULL,
	`record_addable` integer DEFAULT false NOT NULL,
	`record_editable` integer DEFAULT false NOT NULL,
	`record_deletable` integer DEFAULT false NOT NULL,
	`record_importable` integer DEFAULT false NOT NULL,
	`record_exportable` integer DEFAULT false NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_app_acl_rules_app_entity` ON `app_acl_rules` (`app_id`,`entity_type`,`entity_code`);--> statement-breakpoint
CREATE INDEX `idx_app_acl_rules_app_id_priority` ON `app_acl_rules` (`app_id`,`priority`);--> statement-breakpoint
CREATE TABLE `app_actions` (
	`id` text PRIMARY KEY NOT NULL,
	`app_id` text NOT NULL,
	`action_name` text NOT NULL,
	`destination_app_id` text NOT NULL,
	`field_mappings` text DEFAULT '[]' NOT NULL,
	`allowed_entities` text DEFAULT '[]' NOT NULL,
	`filter_condition` text,
	`index` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`destination_app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_app_actions_app_id` ON `app_actions` (`app_id`);--> statement-breakpoint
CREATE TABLE `app_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`app_id` text NOT NULL,
	`is_enabled` integer DEFAULT false NOT NULL,
	`categories` text DEFAULT '[]' NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `app_categories_app_id_unique` ON `app_categories` (`app_id`);--> statement-breakpoint
CREATE TABLE `app_customizations` (
	`id` text PRIMARY KEY NOT NULL,
	`app_id` text NOT NULL,
	`scope` text DEFAULT 'NONE' NOT NULL,
	`desktop` text DEFAULT '{"jsFiles":[],"cssFiles":[]}' NOT NULL,
	`mobile` text DEFAULT '{"jsFiles":[],"cssFiles":[]}' NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `app_customizations_app_id_unique` ON `app_customizations` (`app_id`);--> statement-breakpoint
CREATE TABLE `app_i18n_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`app_id` text NOT NULL,
	`translations` text DEFAULT '[]' NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `app_i18n_configs_app_id_unique` ON `app_i18n_configs` (`app_id`);--> statement-breakpoint
CREATE TABLE `app_notification_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`app_id` text NOT NULL,
	`general_notifications` text DEFAULT '[]' NOT NULL,
	`per_record_notifications` text DEFAULT '[]' NOT NULL,
	`reminder_notifications` text DEFAULT '[]' NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `app_notification_configs_app_id_unique` ON `app_notification_configs` (`app_id`);--> statement-breakpoint
CREATE TABLE `apps` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text,
	`name` text NOT NULL,
	`description` text,
	`space_id` text,
	`thread_id` text,
	`theme` text DEFAULT 'WHITE' NOT NULL,
	`icon` text DEFAULT '{}' NOT NULL,
	`title_field_config` text DEFAULT '{}' NOT NULL,
	`enable_thumbnails` integer DEFAULT false NOT NULL,
	`enable_bulk_deletion` integer DEFAULT false NOT NULL,
	`enable_record_history` integer DEFAULT true NOT NULL,
	`enable_comments` integer DEFAULT true NOT NULL,
	`enable_duplicate_record` integer DEFAULT true NOT NULL,
	`enable_inline_editing` integer DEFAULT true NOT NULL,
	`number_precision` text DEFAULT '{}' NOT NULL,
	`first_month_of_fiscal_year` integer DEFAULT 1 NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'PREVIEW' NOT NULL,
	`creator_id` text NOT NULL,
	`modifier_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`modifier_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `apps_code_unique` ON `apps` (`code`);--> statement-breakpoint
CREATE INDEX `idx_apps_space_id` ON `apps` (`space_id`);--> statement-breakpoint
CREATE INDEX `idx_apps_status` ON `apps` (`status`);--> statement-breakpoint
CREATE INDEX `idx_apps_creator_id` ON `apps` (`creator_id`);--> statement-breakpoint
CREATE TABLE `bookmarks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`category` text NOT NULL,
	`app_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_bookmarks_user_id_created_at` ON `bookmarks` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_bookmarks_user_id_category` ON `bookmarks` (`user_id`,`category`);--> statement-breakpoint
CREATE TABLE `csv_export_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`app_id` text NOT NULL,
	`view_id` text,
	`encoding` text DEFAULT 'UTF-8' NOT NULL,
	`delimiter` text DEFAULT ',' NOT NULL,
	`include_header` integer DEFAULT true NOT NULL,
	`export_fields` text NOT NULL,
	`include_comments` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`output_file_name` text,
	`output_file_size` integer,
	`creator_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_csv_export_jobs_app_id` ON `csv_export_jobs` (`app_id`);--> statement-breakpoint
CREATE INDEX `idx_csv_export_jobs_status` ON `csv_export_jobs` (`status`);--> statement-breakpoint
CREATE TABLE `csv_import_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`app_id` text NOT NULL,
	`file_name` text NOT NULL,
	`file_size` integer NOT NULL,
	`encoding` text DEFAULT 'UTF-8' NOT NULL,
	`delimiter` text DEFAULT ',' NOT NULL,
	`import_mode` text NOT NULL,
	`update_key` text,
	`error_handling` text DEFAULT 'STOP' NOT NULL,
	`field_mappings` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`processed_count` integer DEFAULT 0 NOT NULL,
	`error_count` integer DEFAULT 0 NOT NULL,
	`error_details` text DEFAULT '[]' NOT NULL,
	`creator_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_csv_import_jobs_app_id` ON `csv_import_jobs` (`app_id`);--> statement-breakpoint
CREATE INDEX `idx_csv_import_jobs_status` ON `csv_import_jobs` (`status`);--> statement-breakpoint
CREATE TABLE `direct_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`content` text NOT NULL,
	`attachment_file_keys` text DEFAULT '[]' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`thread_id`) REFERENCES `message_threads`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_direct_messages_thread_id_created_at` ON `direct_messages` (`thread_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_direct_messages_sender_id` ON `direct_messages` (`sender_id`);--> statement-breakpoint
CREATE TABLE `field_acl_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`app_id` text NOT NULL,
	`field_code` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_code` text,
	`include_subs` integer DEFAULT false NOT NULL,
	`accessibility` text DEFAULT 'WRITE' NOT NULL,
	`entity_priority` integer DEFAULT 0 NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_field_acl_rules` ON `field_acl_rules` (`app_id`,`field_code`,`entity_type`,`entity_code`);--> statement-breakpoint
CREATE INDEX `idx_field_acl_rules_app_id_field` ON `field_acl_rules` (`app_id`,`field_code`,`entity_priority`);--> statement-breakpoint
CREATE TABLE `fields` (
	`id` text PRIMARY KEY NOT NULL,
	`app_id` text NOT NULL,
	`field_code` text NOT NULL,
	`label` text NOT NULL,
	`no_label` integer DEFAULT false NOT NULL,
	`field_type` text NOT NULL,
	`required` integer DEFAULT false NOT NULL,
	`is_unique` integer DEFAULT false NOT NULL,
	`default_value` text,
	`properties` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_fields_app_id_field_code` ON `fields` (`app_id`,`field_code`);--> statement-breakpoint
CREATE INDEX `idx_fields_app_id` ON `fields` (`app_id`);--> statement-breakpoint
CREATE INDEX `idx_fields_field_type` ON `fields` (`field_type`);--> statement-breakpoint
CREATE TABLE `follows` (
	`id` text PRIMARY KEY NOT NULL,
	`follower_id` text NOT NULL,
	`followee_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`follower_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`followee_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_follows` ON `follows` (`follower_id`,`followee_id`);--> statement-breakpoint
CREATE INDEX `idx_follows_follower_id` ON `follows` (`follower_id`);--> statement-breakpoint
CREATE INDEX `idx_follows_followee_id` ON `follows` (`followee_id`);--> statement-breakpoint
CREATE TABLE `form_layouts` (
	`id` text PRIMARY KEY NOT NULL,
	`app_id` text NOT NULL,
	`rows` text DEFAULT '[]' NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `form_layouts_app_id_unique` ON `form_layouts` (`app_id`);--> statement-breakpoint
CREATE TABLE `groups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `groups_code_unique` ON `groups` (`code`);--> statement-breakpoint
CREATE TABLE `login_histories` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`ip_address` text NOT NULL,
	`country` text,
	`user_agent` text NOT NULL,
	`success` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_login_histories_user_id_created_at` ON `login_histories` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `message_threads` (
	`id` text PRIMARY KEY NOT NULL,
	`participant_1_id` text NOT NULL,
	`participant_2_id` text NOT NULL,
	`last_message_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`participant_1_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`participant_2_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_message_threads_participants` ON `message_threads` (`participant_1_id`,`participant_2_id`);--> statement-breakpoint
CREATE INDEX `idx_message_threads_participant_1` ON `message_threads` (`participant_1_id`,`last_message_at`);--> statement-breakpoint
CREATE INDEX `idx_message_threads_participant_2` ON `message_threads` (`participant_2_id`,`last_message_at`);--> statement-breakpoint
CREATE TABLE `notification_filter_location_conditions` (
	`id` text PRIMARY KEY NOT NULL,
	`filter_id` text NOT NULL,
	`location_type` text NOT NULL,
	`location_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`filter_id`) REFERENCES `notification_filters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_nf_location_conditions_filter_id` ON `notification_filter_location_conditions` (`filter_id`);--> statement-breakpoint
CREATE TABLE `notification_filter_sender_conditions` (
	`id` text PRIMARY KEY NOT NULL,
	`filter_id` text NOT NULL,
	`sender_type` text NOT NULL,
	`sender_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`filter_id`) REFERENCES `notification_filters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_nf_sender_conditions` ON `notification_filter_sender_conditions` (`filter_id`,`sender_type`,`sender_id`);--> statement-breakpoint
CREATE INDEX `idx_nf_sender_conditions_filter_id` ON `notification_filter_sender_conditions` (`filter_id`);--> statement-breakpoint
CREATE TABLE `notification_filters` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`is_built_in` integer DEFAULT false NOT NULL,
	`name` text NOT NULL,
	`notification_type` text DEFAULT 'ALL' NOT NULL,
	`location_mode` text DEFAULT 'ALL' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_notification_filters_user_id` ON `notification_filters` (`user_id`);--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`email_enabled` integer DEFAULT true NOT NULL,
	`email_scope` text DEFAULT 'MENTION_ONLY' NOT NULL,
	`email_format` text DEFAULT 'HTML' NOT NULL,
	`desktop_enabled` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notification_preferences_user_id_unique` ON `notification_preferences` (`user_id`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`recipient_id` text NOT NULL,
	`type` text NOT NULL,
	`source_type` text NOT NULL,
	`source_id` text NOT NULL,
	`sender_id` text,
	`title` text NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`is_read` integer DEFAULT false NOT NULL,
	`is_read_later` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`recipient_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_notifications_recipient_id_created_at` ON `notifications` (`recipient_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_notifications_recipient_is_read` ON `notifications` (`recipient_id`,`is_read`);--> statement-breakpoint
CREATE INDEX `idx_notifications_recipient_read_later` ON `notifications` (`recipient_id`,`is_read_later`);--> statement-breakpoint
CREATE INDEX `idx_notifications_source` ON `notifications` (`source_type`,`source_id`);--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`parent_organization_id` text,
	`order_index` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`parent_organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organizations_code_unique` ON `organizations` (`code`);--> statement-breakpoint
CREATE INDEX `idx_organizations_parent_id` ON `organizations` (`parent_organization_id`);--> statement-breakpoint
CREATE TABLE `password_histories` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_password_histories_user_id` ON `password_histories` (`user_id`);--> statement-breakpoint
CREATE TABLE `periodic_report_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`report_id` text NOT NULL,
	`snapshot_data` text NOT NULL,
	`captured_at` integer DEFAULT (unixepoch()) NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_periodic_report_snapshots_report_id` ON `periodic_report_snapshots` (`report_id`);--> statement-breakpoint
CREATE INDEX `idx_periodic_report_snapshots_captured_at` ON `periodic_report_snapshots` (`report_id`,`captured_at`);--> statement-breakpoint
CREATE TABLE `plugin_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`app_id` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`config` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_plugin_configs_app_id` ON `plugin_configs` (`app_id`);--> statement-breakpoint
CREATE TABLE `portal_announcements` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text DEFAULT 'お知らせ' NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`attachment_file_keys` text DEFAULT '[]' NOT NULL,
	`last_updated_by` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`last_updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `post_mentions` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`mention_type` text NOT NULL,
	`target_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_post_mentions_post_id` ON `post_mentions` (`post_id`);--> statement-breakpoint
CREATE INDEX `idx_post_mentions_target` ON `post_mentions` (`mention_type`,`target_id`);--> statement-breakpoint
CREATE TABLE `posts` (
	`id` text PRIMARY KEY NOT NULL,
	`author_id` text NOT NULL,
	`content` text NOT NULL,
	`attachment_file_keys` text DEFAULT '[]' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_posts_author_id_created_at` ON `posts` (`author_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `process_definitions` (
	`id` text PRIMARY KEY NOT NULL,
	`app_id` text NOT NULL,
	`is_enabled` integer DEFAULT false NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `process_definitions_app_id_unique` ON `process_definitions` (`app_id`);--> statement-breakpoint
CREATE TABLE `process_statuses` (
	`id` text PRIMARY KEY NOT NULL,
	`process_definition_id` text NOT NULL,
	`name` text NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`process_definition_id`) REFERENCES `process_definitions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_process_statuses_definition_id` ON `process_statuses` (`process_definition_id`);--> statement-breakpoint
CREATE TABLE `process_transitions` (
	`id` text PRIMARY KEY NOT NULL,
	`process_definition_id` text NOT NULL,
	`from_status_id` text NOT NULL,
	`action_name` text NOT NULL,
	`to_status_id` text NOT NULL,
	`assignees` text DEFAULT '[]' NOT NULL,
	`condition` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`process_definition_id`) REFERENCES `process_definitions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`from_status_id`) REFERENCES `process_statuses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_status_id`) REFERENCES `process_statuses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_process_transitions_definition_id` ON `process_transitions` (`process_definition_id`);--> statement-breakpoint
CREATE INDEX `idx_process_transitions_from_status` ON `process_transitions` (`from_status_id`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`cover_image_file_key` text,
	`comment` text DEFAULT '' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_user_id_unique` ON `profiles` (`user_id`);--> statement-breakpoint
CREATE TABLE `record_acl_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`app_id` text NOT NULL,
	`rule_index` integer NOT NULL,
	`filter_cond` text,
	`entity_type` text NOT NULL,
	`entity_code` text,
	`include_subs` integer DEFAULT false NOT NULL,
	`viewable` integer DEFAULT true NOT NULL,
	`editable` integer DEFAULT false NOT NULL,
	`deletable` integer DEFAULT false NOT NULL,
	`entity_priority` integer DEFAULT 0 NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_record_acl_rules_app_id` ON `record_acl_rules` (`app_id`,`rule_index`,`entity_priority`);--> statement-breakpoint
CREATE TABLE `record_comment_likes` (
	`id` text PRIMARY KEY NOT NULL,
	`comment_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`comment_id`) REFERENCES `record_comments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_record_comment_likes` ON `record_comment_likes` (`comment_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `idx_record_comment_likes_comment_id` ON `record_comment_likes` (`comment_id`);--> statement-breakpoint
CREATE TABLE `record_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`record_id` text NOT NULL,
	`app_id` text NOT NULL,
	`text` text NOT NULL,
	`mentions` text DEFAULT '[]' NOT NULL,
	`creator_id` text NOT NULL,
	`like_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`record_id`) REFERENCES `records`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_record_comments_record_id` ON `record_comments` (`record_id`);--> statement-breakpoint
CREATE INDEX `idx_record_comments_app_id` ON `record_comments` (`app_id`);--> statement-breakpoint
CREATE INDEX `idx_record_comments_creator_id` ON `record_comments` (`creator_id`);--> statement-breakpoint
CREATE TABLE `record_histories` (
	`id` text PRIMARY KEY NOT NULL,
	`record_id` text NOT NULL,
	`app_id` text NOT NULL,
	`version` integer NOT NULL,
	`changed_fields` text DEFAULT '[]' NOT NULL,
	`modifier_id` text NOT NULL,
	`modified_at` integer DEFAULT (unixepoch()) NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`record_id`) REFERENCES `records`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`modifier_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_record_histories_record_version` ON `record_histories` (`record_id`,`version`);--> statement-breakpoint
CREATE INDEX `idx_record_histories_record_id` ON `record_histories` (`record_id`);--> statement-breakpoint
CREATE INDEX `idx_record_histories_app_id` ON `record_histories` (`app_id`);--> statement-breakpoint
CREATE TABLE `records` (
	`id` text PRIMARY KEY NOT NULL,
	`app_id` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`field_values` text DEFAULT '{}' NOT NULL,
	`status` text,
	`status_assignees` text DEFAULT '[]' NOT NULL,
	`creator_id` text NOT NULL,
	`modifier_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`modifier_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_records_app_id` ON `records` (`app_id`);--> statement-breakpoint
CREATE INDEX `idx_records_app_id_created_at` ON `records` (`app_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_records_creator_id` ON `records` (`creator_id`);--> statement-breakpoint
CREATE INDEX `idx_records_status` ON `records` (`app_id`,`status`);--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`app_id` text NOT NULL,
	`report_name` text NOT NULL,
	`chart_type` text NOT NULL,
	`chart_sub_type` text,
	`groups` text DEFAULT '[]' NOT NULL,
	`aggregations` text DEFAULT '[]' NOT NULL,
	`filter_condition` text,
	`sort` text DEFAULT '[]' NOT NULL,
	`periodic_report_config` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_reports_app_id` ON `reports` (`app_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`ip_address` text NOT NULL,
	`user_agent` text NOT NULL,
	`country` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_sessions_user_id` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_sessions_expires_at` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `space_announcements` (
	`id` text PRIMARY KEY NOT NULL,
	`space_id` text NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`updated_by` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`space_id`) REFERENCES `spaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `space_announcements_space_id_unique` ON `space_announcements` (`space_id`);--> statement-breakpoint
CREATE TABLE `space_members` (
	`id` text PRIMARY KEY NOT NULL,
	`space_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`entity_code` text NOT NULL,
	`is_admin` integer DEFAULT false NOT NULL,
	`include_subs` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`space_id`) REFERENCES `spaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_space_members` ON `space_members` (`space_id`,`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `idx_space_members_space_id` ON `space_members` (`space_id`);--> statement-breakpoint
CREATE INDEX `idx_space_members_entity` ON `space_members` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE TABLE `space_related_links` (
	`id` text PRIMARY KEY NOT NULL,
	`space_id` text NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`space_id`) REFERENCES `spaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_space_related_links_space_id` ON `space_related_links` (`space_id`);--> statement-breakpoint
CREATE TABLE `space_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`source_space_id` text NOT NULL,
	`use_multi_thread` integer DEFAULT false NOT NULL,
	`fixed_member` integer DEFAULT false NOT NULL,
	`app_creation_permission` text DEFAULT 'EVERYONE' NOT NULL,
	`cover_image` text DEFAULT '{}' NOT NULL,
	`portal_display` text DEFAULT '{}' NOT NULL,
	`thread_names` text DEFAULT '[]' NOT NULL,
	`app_ids` text DEFAULT '[]' NOT NULL,
	`related_links` text DEFAULT '[]' NOT NULL,
	`announcement_body` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`source_space_id`) REFERENCES `spaces`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `spaces` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`is_private` integer DEFAULT false NOT NULL,
	`is_guest` integer DEFAULT false NOT NULL,
	`use_multi_thread` integer DEFAULT false NOT NULL,
	`fixed_member` integer DEFAULT false NOT NULL,
	`cover_image` text DEFAULT '{"type":"PRESET","key":"default"}' NOT NULL,
	`portal_display` text DEFAULT '{"showAnnouncement":true,"showThreadList":true,"showAppList":true,"showMemberList":true,"showRelatedLinkList":true}' NOT NULL,
	`app_creation_permission` text DEFAULT 'EVERYONE' NOT NULL,
	`default_thread_id` text,
	`creator_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_spaces_creator_id` ON `spaces` (`creator_id`);--> statement-breakpoint
CREATE INDEX `idx_spaces_is_guest` ON `spaces` (`is_guest`);--> statement-breakpoint
CREATE TABLE `stored_files` (
	`id` text PRIMARY KEY NOT NULL,
	`file_key` text NOT NULL,
	`file_name` text NOT NULL,
	`content_type` text NOT NULL,
	`size` integer NOT NULL,
	`uploader_id` text NOT NULL,
	`status` text DEFAULT 'TEMPORARY' NOT NULL,
	`uploaded_at` integer DEFAULT (unixepoch()) NOT NULL,
	`expires_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`uploader_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stored_files_file_key_unique` ON `stored_files` (`file_key`);--> statement-breakpoint
CREATE INDEX `idx_stored_files_uploader_id` ON `stored_files` (`uploader_id`);--> statement-breakpoint
CREATE INDEX `idx_stored_files_status` ON `stored_files` (`status`);--> statement-breakpoint
CREATE INDEX `idx_stored_files_expires_at` ON `stored_files` (`expires_at`);--> statement-breakpoint
CREATE TABLE `system_permissions` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_code` text NOT NULL,
	`include_subs` integer DEFAULT false NOT NULL,
	`system_admin` integer DEFAULT false NOT NULL,
	`app_group_viewable` integer DEFAULT false NOT NULL,
	`app_group_manageable` integer DEFAULT false NOT NULL,
	`app_create` integer DEFAULT false NOT NULL,
	`app_manage` integer DEFAULT false NOT NULL,
	`space_create` integer DEFAULT false NOT NULL,
	`guest_space_create` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_system_permissions_entity` ON `system_permissions` (`entity_type`,`entity_code`);--> statement-breakpoint
CREATE TABLE `system_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `system_settings_key_unique` ON `system_settings` (`key`);--> statement-breakpoint
CREATE TABLE `thread_comment_likes` (
	`id` text PRIMARY KEY NOT NULL,
	`comment_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`comment_id`) REFERENCES `thread_comments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_thread_comment_likes` ON `thread_comment_likes` (`comment_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `idx_thread_comment_likes_comment_id` ON `thread_comment_likes` (`comment_id`);--> statement-breakpoint
CREATE TABLE `thread_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`space_id` text NOT NULL,
	`text` text,
	`mentions` text DEFAULT '[]' NOT NULL,
	`files` text DEFAULT '[]' NOT NULL,
	`creator_id` text NOT NULL,
	`like_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`thread_id`) REFERENCES `threads`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`space_id`) REFERENCES `spaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_thread_comments_thread_id` ON `thread_comments` (`thread_id`);--> statement-breakpoint
CREATE INDEX `idx_thread_comments_space_id` ON `thread_comments` (`space_id`);--> statement-breakpoint
CREATE INDEX `idx_thread_comments_creator_id` ON `thread_comments` (`creator_id`);--> statement-breakpoint
CREATE TABLE `thread_follows` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`thread_id`) REFERENCES `threads`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_thread_follows` ON `thread_follows` (`thread_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `idx_thread_follows_thread_id` ON `thread_follows` (`thread_id`);--> statement-breakpoint
CREATE INDEX `idx_thread_follows_user_id` ON `thread_follows` (`user_id`);--> statement-breakpoint
CREATE TABLE `threads` (
	`id` text PRIMARY KEY NOT NULL,
	`space_id` text NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`creator_id` text NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`notify_on_create` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`space_id`) REFERENCES `spaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_threads_space_id` ON `threads` (`space_id`);--> statement-breakpoint
CREATE TABLE `user_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`group_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_user_groups` ON `user_groups` (`user_id`,`group_id`);--> statement-breakpoint
CREATE INDEX `idx_user_groups_user_id` ON `user_groups` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_groups_group_id` ON `user_groups` (`group_id`);--> statement-breakpoint
CREATE TABLE `user_organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`organization_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_user_organizations` ON `user_organizations` (`user_id`,`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_user_organizations_user_id` ON `user_organizations` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_organizations_organization_id` ON `user_organizations` (`organization_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`login_name` text NOT NULL,
	`display_name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`password_algorithm` text DEFAULT 'bcrypt' NOT NULL,
	`primary_organization_id` text,
	`timezone` text DEFAULT 'Asia/Tokyo' NOT NULL,
	`language` text DEFAULT 'ja' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`avatar_file_key` text,
	`failed_login_attempts` integer DEFAULT 0 NOT NULL,
	`locked_until` integer,
	`password_changed_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`primary_organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_login_name_unique` ON `users` (`login_name`);--> statement-breakpoint
CREATE INDEX `idx_users_email` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_users_primary_organization_id` ON `users` (`primary_organization_id`);--> statement-breakpoint
CREATE INDEX `idx_users_is_active` ON `users` (`is_active`);--> statement-breakpoint
CREATE TABLE `views` (
	`id` text PRIMARY KEY NOT NULL,
	`app_id` text NOT NULL,
	`view_name` text NOT NULL,
	`view_type` text NOT NULL,
	`fields` text DEFAULT '[]' NOT NULL,
	`calendar_date_field` text,
	`calendar_title_field` text,
	`html` text,
	`pager` integer DEFAULT true NOT NULL,
	`device_scope` text,
	`filter_condition` text,
	`sort` text DEFAULT '[]' NOT NULL,
	`index` integer DEFAULT 0 NOT NULL,
	`builtin_type` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_views_app_id_view_name` ON `views` (`app_id`,`view_name`);--> statement-breakpoint
CREATE INDEX `idx_views_app_id` ON `views` (`app_id`);--> statement-breakpoint
CREATE TABLE `webhook_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`app_id` text NOT NULL,
	`url` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`events` text DEFAULT '[]' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_webhook_configs_app_id` ON `webhook_configs` (`app_id`);