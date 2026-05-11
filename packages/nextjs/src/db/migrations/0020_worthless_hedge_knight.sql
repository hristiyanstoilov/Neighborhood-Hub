CREATE INDEX "community_drives_deadline_idx" ON "community_drives" USING btree ("deadline");--> statement-breakpoint
CREATE INDEX "events_starts_at_idx" ON "events" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "food_shares_available_until_idx" ON "food_shares" USING btree ("available_until");