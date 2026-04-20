CREATE TABLE "ratings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"rater_id" uuid NOT NULL,
	"rated_user_id" uuid NOT NULL,
	"context_type" varchar(30) NOT NULL,
	"context_id" uuid NOT NULL,
	"score" integer NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ratings_score_check" CHECK ("ratings"."score" BETWEEN 1 AND 5),
	CONSTRAINT "ratings_context_type_check" CHECK ("ratings"."context_type" IN ('skill_request', 'tool_reservation', 'food_reservation')),
	CONSTRAINT "ratings_not_self_check" CHECK ("ratings"."rater_id" != "ratings"."rated_user_id")
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "avg_rating" numeric(3, 2);--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "rating_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_rater_id_users_id_fk" FOREIGN KEY ("rater_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_rated_user_id_users_id_fk" FOREIGN KEY ("rated_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ratings_rater_context_idx" ON "ratings" USING btree ("rater_id","context_type","context_id");--> statement-breakpoint
CREATE INDEX "ratings_rated_user_idx" ON "ratings" USING btree ("rated_user_id");--> statement-breakpoint
CREATE INDEX "ratings_context_idx" ON "ratings" USING btree ("context_type","context_id");