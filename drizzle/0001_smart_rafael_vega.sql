CREATE TABLE `email_deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`payload` text NOT NULL,
	`provider_id` text
);
--> statement-breakpoint
CREATE TABLE `email_recipients` (
	`user_id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`enabled` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `setup_drafts` (
	`user_id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL
);
