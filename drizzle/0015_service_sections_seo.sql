-- Service page sections + expanded SEO fields
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "page_sections" jsonb;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "secondary_keywords" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "social_title" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "social_description" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "no_follow" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "no_archive" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "schema_json" jsonb;--> statement-breakpoint

ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "secondary_keywords" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "schema_json" jsonb;--> statement-breakpoint

ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "secondary_keywords" text;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "social_title" text;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "social_description" text;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "no_follow" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "no_archive" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "schema_json" jsonb;--> statement-breakpoint

ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "secondary_keywords" text;--> statement-breakpoint
ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "schema_json" jsonb;--> statement-breakpoint

ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "meta_title" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "meta_description" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "focus_keyword" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "secondary_keywords" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "no_index" boolean DEFAULT false;--> statement-breakpoint

ALTER TABLE "tags" ADD COLUMN IF NOT EXISTS "meta_title" text;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN IF NOT EXISTS "meta_description" text;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN IF NOT EXISTS "focus_keyword" text;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN IF NOT EXISTS "secondary_keywords" text;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN IF NOT EXISTS "no_index" boolean DEFAULT false;--> statement-breakpoint
