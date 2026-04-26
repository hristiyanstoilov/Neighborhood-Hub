CREATE TABLE "point_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"points" integer NOT NULL,
	"entity_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "point_events_points_check" CHECK ("point_events"."points" != 0),
	CONSTRAINT "point_events_type_check" CHECK ("point_events"."type" IN ('skill_shared', 'tool_lent', 'food_donated', 'drive_pledged', 'rating_given', 'five_star_received'))
);
--> statement-breakpoint
CREATE TABLE "user_stats" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"total_points" integer DEFAULT 0 NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_stats_level_check" CHECK ("user_stats"."level" BETWEEN 1 AND 5),
	CONSTRAINT "user_stats_points_pos_check" CHECK ("user_stats"."total_points" >= 0)
);
--> statement-breakpoint
ALTER TABLE "point_events" ADD CONSTRAINT "point_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "point_events_user_idx" ON "point_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_stats_user_idx" ON "user_stats" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_stats_points_idx" ON "user_stats" USING btree ("total_points");