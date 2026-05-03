-- Composite index for notifications list query:
-- WHERE user_id = ? ORDER BY created_at DESC LIMIT ?
-- Eliminates the sort step vs. the plain user_id index.
CREATE INDEX IF NOT EXISTS "notifications_user_created_idx"
  ON "notifications" ("user_id", "created_at" DESC);

-- Conversations participant indexes for:
-- WHERE participant_a = ? OR participant_b = ? ORDER BY updated_at DESC
-- The existing pair index (participant_a, participant_b) cannot be used for OR queries.
CREATE INDEX IF NOT EXISTS "conversations_participant_a_updated_idx"
  ON "conversations" ("participant_a", "updated_at" DESC);

CREATE INDEX IF NOT EXISTS "conversations_participant_b_updated_idx"
  ON "conversations" ("participant_b", "updated_at" DESC);

-- Composite audit log index for admin filtered queries:
-- WHERE action = ? AND entity = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS "audit_log_action_entity_idx"
  ON "audit_log" ("action", "entity", "created_at" DESC);
