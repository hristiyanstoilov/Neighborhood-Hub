ALTER TABLE "user_stats" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "user_stats" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone;
--> statement-breakpoint
UPDATE "user_stats" SET "created_at" = now() WHERE "created_at" IS NULL;
--> statement-breakpoint
UPDATE "user_stats" SET "updated_at" = now() WHERE "updated_at" IS NULL;
--> statement-breakpoint
ALTER TABLE "user_stats" ALTER COLUMN "created_at" SET DEFAULT now();
--> statement-breakpoint
ALTER TABLE "user_stats" ALTER COLUMN "updated_at" SET DEFAULT now();
--> statement-breakpoint
ALTER TABLE "user_stats" ALTER COLUMN "created_at" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "user_stats" ALTER COLUMN "updated_at" SET NOT NULL;