CREATE TABLE "badges" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"awarded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "badges_type_check" CHECK ("badges"."type" IN ('first_skill', 'first_tool', 'first_food', 'ten_points', 'fifty_points', 'five_star_giver', 'community_hero'))
);
--> statement-breakpoint
CREATE TABLE "user_stats" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"total_points" integer DEFAULT 0 NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_stats_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "user_stats_total_points_check" CHECK ("user_stats"."total_points" >= 0),
	CONSTRAINT "user_stats_level_check" CHECK ("user_stats"."level" >= 1)
);
--> statement-breakpoint
ALTER TABLE "badges" ADD CONSTRAINT "badges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "badges_user_type_idx" ON "badges" USING btree ("user_id","type");--> statement-breakpoint
CREATE INDEX "badges_user_id_idx" ON "badges" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_stats_total_points_idx" ON "user_stats" USING btree ("total_points");