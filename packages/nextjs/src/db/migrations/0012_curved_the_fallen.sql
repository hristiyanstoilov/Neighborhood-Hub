CREATE TABLE "content_reports" (
	"id" uuid PRIMARY KEY NOT NULL,
	"reporter_id" uuid NOT NULL,
	"entity_type" varchar(30) NOT NULL,
	"entity_id" uuid NOT NULL,
	"reason" varchar(30) NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_reports_entity_type_check" CHECK ("content_reports"."entity_type" IN ('skill', 'tool', 'food_share', 'event', 'community_drive')),
	CONSTRAINT "content_reports_reason_check" CHECK ("content_reports"."reason" IN ('spam', 'inappropriate', 'misleading', 'other'))
);
--> statement-breakpoint
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_resolved_by_id_users_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "content_reports_active_idx" ON "content_reports" USING btree ("reporter_id","entity_type","entity_id") WHERE "content_reports"."resolved_at" IS NULL;--> statement-breakpoint
CREATE INDEX "content_reports_entity_idx" ON "content_reports" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "content_reports_pending_idx" ON "content_reports" USING btree ("resolved_at");