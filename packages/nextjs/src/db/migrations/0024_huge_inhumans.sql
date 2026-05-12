ALTER TABLE "community_drives" ADD COLUMN "goal_amount" integer;--> statement-breakpoint
ALTER TABLE "community_drives" ADD COLUMN "current_amount" integer DEFAULT 0;