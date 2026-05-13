CREATE TABLE "skill_endorsements" (
	"id" uuid PRIMARY KEY NOT NULL,
	"skill_id" uuid NOT NULL,
	"endorser_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "skill_endorsements" ADD CONSTRAINT "skill_endorsements_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_endorsements" ADD CONSTRAINT "skill_endorsements_endorser_id_users_id_fk" FOREIGN KEY ("endorser_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "skill_endorsements_skill_endorser_idx" ON "skill_endorsements" USING btree ("skill_id","endorser_id");
