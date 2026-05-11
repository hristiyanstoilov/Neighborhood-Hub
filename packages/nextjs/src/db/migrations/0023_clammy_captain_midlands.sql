CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX "events_title_trgm_idx" ON "events" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "food_shares_title_trgm_idx" ON "food_shares" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "skills_title_trgm_idx" ON "skills" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "tools_title_trgm_idx" ON "tools" USING gin ("title" gin_trgm_ops);