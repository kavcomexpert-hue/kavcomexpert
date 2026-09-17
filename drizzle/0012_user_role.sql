-- Add role to Better Auth user (default author)
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'author' NOT NULL;--> statement-breakpoint
UPDATE "user" SET "role" = 'author' WHERE "role" IS NULL OR "role" = '';
