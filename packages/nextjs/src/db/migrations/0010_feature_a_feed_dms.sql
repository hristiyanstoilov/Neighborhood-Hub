CREATE TABLE "feed_events" (
  "id" uuid PRIMARY KEY NOT NULL,
  "actor_id" uuid NOT NULL,
  "actor_name" varchar(100) NOT NULL,
  "event_type" varchar(40) NOT NULL,
  "target_id" uuid NOT NULL,
  "target_title" varchar(220) NOT NULL,
  "target_url" varchar(400) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "feed_events_type_check" CHECK ("feed_events"."event_type" IN ('skill_listed', 'tool_listed', 'food_shared', 'drive_opened', 'event_created'))
);
--> statement-breakpoint
CREATE TABLE "conversations" (
  "id" uuid PRIMARY KEY NOT NULL,
  "participant_a" uuid NOT NULL,
  "participant_b" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "conversations_no_self_check" CHECK ("conversations"."participant_a" != "conversations"."participant_b")
);
--> statement-breakpoint
CREATE TABLE "messages" (
  "id" uuid PRIMARY KEY NOT NULL,
  "conversation_id" uuid NOT NULL,
  "sender_id" uuid NOT NULL,
  "body" text NOT NULL,
  "read_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "messages_body_not_empty_check" CHECK (char_length(trim("messages"."body")) > 0)
);
--> statement-breakpoint
ALTER TABLE "feed_events" ADD CONSTRAINT "feed_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_participant_a_users_id_fk" FOREIGN KEY ("participant_a") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_participant_b_users_id_fk" FOREIGN KEY ("participant_b") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "feed_events_created_at_idx" ON "feed_events" USING btree ("created_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "conversations_pair_idx" ON "conversations" USING btree ("participant_a", "participant_b");
--> statement-breakpoint
CREATE INDEX "conversations_updated_at_idx" ON "conversations" USING btree ("updated_at");
--> statement-breakpoint
CREATE INDEX "messages_conversation_idx" ON "messages" USING btree ("conversation_id", "created_at");
