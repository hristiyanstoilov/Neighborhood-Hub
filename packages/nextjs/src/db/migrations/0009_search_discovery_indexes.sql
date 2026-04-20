ALTER TABLE "skills"
  ADD COLUMN IF NOT EXISTS "search_vector" tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce("title", '') || ' ' || coalesce("description", ''))
  ) STORED;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "skills_search_idx" ON "skills" USING GIN ("search_vector");
--> statement-breakpoint
ALTER TABLE "tools"
  ADD COLUMN IF NOT EXISTS "search_vector" tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce("title", '') || ' ' || coalesce("description", ''))
  ) STORED;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tools_search_idx" ON "tools" USING GIN ("search_vector");
--> statement-breakpoint
ALTER TABLE "events"
  ADD COLUMN IF NOT EXISTS "search_vector" tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce("title", '') || ' ' || coalesce("description", ''))
  ) STORED;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_search_idx" ON "events" USING GIN ("search_vector");
--> statement-breakpoint
ALTER TABLE "community_drives"
  ADD COLUMN IF NOT EXISTS "search_vector" tsvector
  GENERATED ALWAYS AS (
    to_tsvector(
      'english',
      coalesce("title", '') || ' ' || coalesce("description", '') || ' ' || coalesce("goal_description", '')
    )
  ) STORED;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "community_drives_search_idx" ON "community_drives" USING GIN ("search_vector");
--> statement-breakpoint
ALTER TABLE "food_shares"
  ADD COLUMN IF NOT EXISTS "search_vector" tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce("title", '') || ' ' || coalesce("description", ''))
  ) STORED;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "food_shares_search_idx" ON "food_shares" USING GIN ("search_vector");