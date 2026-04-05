ALTER TABLE `user` ADD `created_at` integer;--> statement-breakpoint
UPDATE `user` SET `created_at` = 1704067200000 WHERE `created_at` IS NULL;
