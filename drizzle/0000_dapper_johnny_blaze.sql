CREATE TABLE `audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`action` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `financial_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `runway_snapshots` (
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`runway` integer NOT NULL,
	`balance` integer NOT NULL,
	`safe` integer NOT NULL,
	PRIMARY KEY(`user_id`, `date`)
);
