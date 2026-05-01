-- Prevent double-awarding the same point event type for the same entity.
-- Partial index (WHERE entity_id IS NOT NULL) because all current callers
-- supply an entityId, and NULL != NULL in PostgreSQL unique indexes anyway.
CREATE UNIQUE INDEX "point_events_dedup_idx"
  ON "point_events" USING btree ("user_id", "type", "entity_id")
  WHERE "entity_id" IS NOT NULL;
