CREATE TABLE "food_reservations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"food_share_id" uuid NOT NULL,
	"requester_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"pickup_at" timestamp with time zone NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"notes" text,
	"cancellation_reason" text,
	"cancelled_by_id" uuid,
	"picked_up_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "food_reservations_status_check" CHECK ("food_reservations"."status" IN ('pending', 'reserved', 'picked_up', 'rejected', 'cancelled')),
	CONSTRAINT "food_reservations_pickup_check" CHECK ("food_reservations"."pickup_at" >= "food_reservations"."created_at"),
	CONSTRAINT "food_reservations_self_check" CHECK ("food_reservations"."requester_id" != "food_reservations"."owner_id")
);
--> statement-breakpoint
CREATE TABLE "food_shares" (
	"id" uuid PRIMARY KEY NOT NULL,
	"owner_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"quantity" integer NOT NULL,
	"location_id" uuid,
	"available_until" timestamp with time zone,
	"pickup_instructions" varchar(500),
	"image_url" varchar(2048),
	"status" varchar(20) DEFAULT 'available' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "food_shares_status_check" CHECK ("food_shares"."status" IN ('available', 'reserved', 'picked_up')),
	CONSTRAINT "food_shares_quantity_check" CHECK ("food_shares"."quantity" > 0),
	CONSTRAINT "food_shares_title_length_check" CHECK (char_length("food_shares"."title") >= 3),
	CONSTRAINT "food_shares_available_until_check" CHECK ("food_shares"."available_until" IS NULL OR "food_shares"."available_until" > "food_shares"."created_at")
);
--> statement-breakpoint
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_type_check";--> statement-breakpoint
ALTER TABLE "food_reservations" ADD CONSTRAINT "food_reservations_food_share_id_food_shares_id_fk" FOREIGN KEY ("food_share_id") REFERENCES "public"."food_shares"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_reservations" ADD CONSTRAINT "food_reservations_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_reservations" ADD CONSTRAINT "food_reservations_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_reservations" ADD CONSTRAINT "food_reservations_cancelled_by_id_users_id_fk" FOREIGN KEY ("cancelled_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_shares" ADD CONSTRAINT "food_shares_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_shares" ADD CONSTRAINT "food_shares_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "food_reservations_food_share_id_idx" ON "food_reservations" USING btree ("food_share_id");--> statement-breakpoint
CREATE INDEX "food_reservations_requester_id_idx" ON "food_reservations" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "food_reservations_owner_id_idx" ON "food_reservations" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "food_reservations_requester_status_idx" ON "food_reservations" USING btree ("requester_id","status");--> statement-breakpoint
CREATE INDEX "food_reservations_owner_status_idx" ON "food_reservations" USING btree ("owner_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "food_reservations_active_idx" ON "food_reservations" USING btree ("food_share_id","requester_id") WHERE "food_reservations"."status" IN ('pending', 'reserved');--> statement-breakpoint
CREATE INDEX "food_shares_owner_id_idx" ON "food_shares" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "food_shares_status_idx" ON "food_shares" USING btree ("status") WHERE "food_shares"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "food_shares_location_id_idx" ON "food_shares" USING btree ("location_id") WHERE "food_shares"."deleted_at" IS NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_type_check" CHECK ("notifications"."type" IN ('request_accepted', 'request_rejected', 'new_request', 'request_cancelled', 'request_completed', 'reservation_approved', 'reservation_rejected', 'reservation_new', 'reservation_cancelled', 'reservation_returned', 'event_new_rsvp', 'event_cancelled', 'drive_new_pledge', 'drive_pledge_fulfilled', 'drive_completed', 'food_reservation_new', 'food_reservation_approved', 'food_reservation_rejected', 'food_reservation_cancelled', 'food_reservation_picked_up'));