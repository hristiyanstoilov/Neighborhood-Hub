CREATE TYPE "public"."ai_message_role" AS ENUM('user', 'assistant');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "ai_conversations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(200),
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_messages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"conversation_id" uuid NOT NULL,
	"role" "ai_message_role" NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"user_email" varchar(255),
	"action" varchar(100) NOT NULL,
	"entity" varchar(100),
	"entity_id" uuid,
	"metadata" jsonb,
	"ip_address" "inet",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audit_log_action_check" CHECK ("audit_log"."action" IN ('create', 'update', 'delete', 'login', 'logout', 'register', 'verify_email', 'reset_password'))
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"label" varchar(200) NOT NULL,
	"icon" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"city" varchar(100) NOT NULL,
	"neighborhood" varchar(100) NOT NULL,
	"lat" numeric(9, 6) NOT NULL,
	"lng" numeric(9, 6) NOT NULL,
	"country_code" char(2) DEFAULT 'BG' NOT NULL,
	"type" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "locations_type_check" CHECK ("locations"."type" IN ('skill_location', 'event_location', 'thing_location', 'food_location', 'neighborhood'))
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(100) NOT NULL,
	"entity_type" varchar(50) DEFAULT 'skill_request' NOT NULL,
	"entity_id" uuid,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notifications_type_check" CHECK ("notifications"."type" IN ('request_accepted', 'request_rejected', 'new_request', 'request_cancelled', 'request_completed'))
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100),
	"bio" text,
	"avatar_url" varchar(2048),
	"location_id" uuid,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"is_revoked" boolean DEFAULT false NOT NULL,
	"user_agent" text,
	"ip_address" "inet",
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_tokens_token_unique" UNIQUE("token"),
	CONSTRAINT "refresh_tokens_expiry_check" CHECK ("refresh_tokens"."expires_at" > "refresh_tokens"."created_at")
);
--> statement-breakpoint
CREATE TABLE "skill_requests" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_from_id" uuid NOT NULL,
	"user_to_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"scheduled_start" timestamp with time zone NOT NULL,
	"scheduled_end" timestamp with time zone NOT NULL,
	"meeting_type" varchar(20) NOT NULL,
	"meeting_url" varchar(2048),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"notes" text,
	"cancellation_reason" text,
	"cancelled_by_id" uuid,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "skill_requests_status_check" CHECK ("skill_requests"."status" IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
	CONSTRAINT "skill_requests_meeting_type_check" CHECK ("skill_requests"."meeting_type" IN ('in_person', 'online', 'hybrid')),
	CONSTRAINT "skill_requests_meeting_url_check" CHECK ("skill_requests"."meeting_type" = 'in_person' OR ("skill_requests"."meeting_type" IN ('online', 'hybrid') AND "skill_requests"."meeting_url" IS NOT NULL)),
	CONSTRAINT "skill_requests_time_check" CHECK ("skill_requests"."scheduled_end" > "skill_requests"."scheduled_start"),
	CONSTRAINT "skill_requests_self_check" CHECK ("skill_requests"."user_from_id" != "skill_requests"."user_to_id")
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY NOT NULL,
	"owner_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"category_id" uuid,
	"available_hours" integer NOT NULL,
	"status" varchar(20) DEFAULT 'available' NOT NULL,
	"image_url" varchar(2048),
	"location_id" uuid,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "skills_status_check" CHECK ("skills"."status" IN ('available', 'busy', 'retired')),
	CONSTRAINT "skills_hours_check" CHECK ("skills"."available_hours" >= 0 AND "skills"."available_hours" <= 168),
	CONSTRAINT "skills_title_length_check" CHECK (char_length("skills"."title") >= 3)
);
--> statement-breakpoint
CREATE TABLE "user_consents" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"consent_type" varchar(100) NOT NULL,
	"granted" boolean NOT NULL,
	"granted_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"ip_address" "inet",
	"version" varchar(20) NOT NULL,
	CONSTRAINT "user_consents_type_check" CHECK ("user_consents"."consent_type" IN ('terms', 'marketing', 'analytics', 'ai_data'))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"email_verified_at" timestamp with time zone,
	"email_verification_token" varchar(64),
	"email_verification_expires_at" timestamp with time zone,
	"password_reset_token" varchar(64),
	"password_reset_expires_at" timestamp with time zone,
	"failed_login_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_email_format" CHECK ("users"."email" ~ '^[^@]+@[^@]+.[^@]+$')
);
--> statement-breakpoint
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversation_id_ai_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_requests" ADD CONSTRAINT "skill_requests_user_from_id_users_id_fk" FOREIGN KEY ("user_from_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_requests" ADD CONSTRAINT "skill_requests_user_to_id_users_id_fk" FOREIGN KEY ("user_to_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_requests" ADD CONSTRAINT "skill_requests_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_requests" ADD CONSTRAINT "skill_requests_cancelled_by_id_users_id_fk" FOREIGN KEY ("cancelled_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_conversations_user_id_idx" ON "ai_conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_messages_conversation_id_idx" ON "ai_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "audit_log_user_id_idx" ON "audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "locations_city_neighborhood_type_idx" ON "locations" USING btree ("city","neighborhood","type");--> statement-breakpoint
CREATE INDEX "locations_lat_lng_idx" ON "locations" USING btree ("lat","lng");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_unread_idx" ON "notifications" USING btree ("user_id","is_read") WHERE "notifications"."is_read" = false;--> statement-breakpoint
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "refresh_tokens_token_idx" ON "refresh_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "skill_requests_user_from_idx" ON "skill_requests" USING btree ("user_from_id");--> statement-breakpoint
CREATE INDEX "skill_requests_user_to_idx" ON "skill_requests" USING btree ("user_to_id");--> statement-breakpoint
CREATE INDEX "skill_requests_skill_id_idx" ON "skill_requests" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "skill_requests_status_idx" ON "skill_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "skill_requests_user_from_status_idx" ON "skill_requests" USING btree ("user_from_id","status");--> statement-breakpoint
CREATE INDEX "skill_requests_user_to_status_idx" ON "skill_requests" USING btree ("user_to_id","status");--> statement-breakpoint
CREATE INDEX "skills_owner_id_idx" ON "skills" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "skills_status_idx" ON "skills" USING btree ("status") WHERE "skills"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "skills_category_id_idx" ON "skills" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "skills_location_id_idx" ON "skills" USING btree ("location_id") WHERE "skills"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "user_consents_unique_idx" ON "user_consents" USING btree ("user_id","consent_type","version");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_active_idx" ON "users" USING btree ("id") WHERE "users"."deleted_at" IS NULL;