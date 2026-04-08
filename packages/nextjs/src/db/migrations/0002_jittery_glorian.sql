ALTER TABLE "users" DROP CONSTRAINT "users_email_format";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_format" CHECK ("users"."email" ~ '^[^@]+@[^@]+\.[^@]+$');