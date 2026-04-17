CREATE TABLE "community_drives" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organizer_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"drive_type" varchar(20) NOT NULL,
	"goal_description" varchar(500),
	"drop_off_address" varchar(300),
	"deadline" timestamp with time zone,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "community_drives_status_check" CHECK ("community_drives"."status" IN ('open', 'completed', 'cancelled')),
	CONSTRAINT "community_drives_type_check" CHECK ("community_drives"."drive_type" IN ('items', 'money', 'food', 'other')),
	CONSTRAINT "community_drives_title_length_check" CHECK (char_length("community_drives"."title") >= 3)
);
--> statement-breakpoint
CREATE TABLE "drive_pledges" (
	"id" uuid PRIMARY KEY NOT NULL,
	"drive_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"pledge_description" varchar(500) NOT NULL,
	"status" varchar(20) DEFAULT 'pledged' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "drive_pledges_status_check" CHECK ("drive_pledges"."status" IN ('pledged', 'fulfilled', 'cancelled'))
);
--> statement-breakpoint
CREATE TABLE "event_attendees" (
	"id" uuid PRIMARY KEY NOT NULL,
	"event_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'attending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_attendees_status_check" CHECK ("event_attendees"."status" IN ('attending', 'cancelled'))
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organizer_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"location_id" uuid,
	"address" varchar(300),
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"max_capacity" integer,
	"status" varchar(20) DEFAULT 'published' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_status_check" CHECK ("events"."status" IN ('published', 'cancelled', 'completed')),
	CONSTRAINT "events_title_length_check" CHECK (char_length("events"."title") >= 3),
	CONSTRAINT "events_capacity_check" CHECK ("events"."max_capacity" IS NULL OR "events"."max_capacity" > 0),
	CONSTRAINT "events_ends_after_starts_check" CHECK ("events"."ends_at" IS NULL OR "events"."ends_at" > "events"."starts_at")
);
--> statement-breakpoint
ALTER TABLE "community_drives" ADD CONSTRAINT "community_drives_organizer_id_users_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drive_pledges" ADD CONSTRAINT "drive_pledges_drive_id_community_drives_id_fk" FOREIGN KEY ("drive_id") REFERENCES "public"."community_drives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drive_pledges" ADD CONSTRAINT "drive_pledges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_organizer_id_users_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "community_drives_organizer_id_idx" ON "community_drives" USING btree ("organizer_id");--> statement-breakpoint
CREATE INDEX "community_drives_status_idx" ON "community_drives" USING btree ("status") WHERE "community_drives"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "drive_pledges_drive_user_idx" ON "drive_pledges" USING btree ("drive_id","user_id");--> statement-breakpoint
CREATE INDEX "drive_pledges_drive_id_idx" ON "drive_pledges" USING btree ("drive_id");--> statement-breakpoint
CREATE INDEX "drive_pledges_user_id_idx" ON "drive_pledges" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_attendees_event_user_idx" ON "event_attendees" USING btree ("event_id","user_id");--> statement-breakpoint
CREATE INDEX "event_attendees_event_id_idx" ON "event_attendees" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_attendees_user_id_idx" ON "event_attendees" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "events_organizer_id_idx" ON "events" USING btree ("organizer_id");--> statement-breakpoint
CREATE INDEX "events_status_starts_at_idx" ON "events" USING btree ("status","starts_at") WHERE "events"."deleted_at" IS NULL;