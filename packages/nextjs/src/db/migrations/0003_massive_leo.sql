CREATE TABLE "tool_reservations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tool_id" uuid NOT NULL,
	"borrower_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"notes" text,
	"cancellation_reason" text,
	"cancelled_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tool_reservations_status_check" CHECK ("tool_reservations"."status" IN ('pending', 'approved', 'rejected', 'returned', 'cancelled')),
	CONSTRAINT "tool_reservations_dates_check" CHECK ("tool_reservations"."end_date" >= "tool_reservations"."start_date"),
	CONSTRAINT "tool_reservations_self_check" CHECK ("tool_reservations"."borrower_id" != "tool_reservations"."owner_id")
);
--> statement-breakpoint
CREATE TABLE "tools" (
	"id" uuid PRIMARY KEY NOT NULL,
	"owner_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"category_id" uuid,
	"location_id" uuid,
	"condition" varchar(20),
	"status" varchar(20) DEFAULT 'available' NOT NULL,
	"image_url" varchar(2048),
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tools_status_check" CHECK ("tools"."status" IN ('available', 'in_use', 'on_loan')),
	CONSTRAINT "tools_condition_check" CHECK ("tools"."condition" IS NULL OR "tools"."condition" IN ('new', 'good', 'fair', 'worn')),
	CONSTRAINT "tools_title_length_check" CHECK (char_length("tools"."title") >= 3)
);
--> statement-breakpoint
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_type_check";--> statement-breakpoint
ALTER TABLE "tool_reservations" ADD CONSTRAINT "tool_reservations_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_reservations" ADD CONSTRAINT "tool_reservations_borrower_id_users_id_fk" FOREIGN KEY ("borrower_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_reservations" ADD CONSTRAINT "tool_reservations_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_reservations" ADD CONSTRAINT "tool_reservations_cancelled_by_id_users_id_fk" FOREIGN KEY ("cancelled_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tools" ADD CONSTRAINT "tools_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tools" ADD CONSTRAINT "tools_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tools" ADD CONSTRAINT "tools_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tool_reservations_tool_id_idx" ON "tool_reservations" USING btree ("tool_id");--> statement-breakpoint
CREATE INDEX "tool_reservations_borrower_id_idx" ON "tool_reservations" USING btree ("borrower_id");--> statement-breakpoint
CREATE INDEX "tool_reservations_owner_id_idx" ON "tool_reservations" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "tool_reservations_borrower_status_idx" ON "tool_reservations" USING btree ("borrower_id","status");--> statement-breakpoint
CREATE INDEX "tool_reservations_owner_status_idx" ON "tool_reservations" USING btree ("owner_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "tool_reservations_active_idx" ON "tool_reservations" USING btree ("tool_id","borrower_id") WHERE "tool_reservations"."status" IN ('pending', 'approved');--> statement-breakpoint
CREATE INDEX "tools_owner_id_idx" ON "tools" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "tools_status_idx" ON "tools" USING btree ("status") WHERE "tools"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "tools_category_id_idx" ON "tools" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "tools_location_id_idx" ON "tools" USING btree ("location_id") WHERE "tools"."deleted_at" IS NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_type_check" CHECK ("notifications"."type" IN ('request_accepted', 'request_rejected', 'new_request', 'request_cancelled', 'request_completed', 'reservation_approved', 'reservation_rejected', 'reservation_new', 'reservation_cancelled', 'reservation_returned'));