ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "logo_url" text;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "maintenance_title" text;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "maintenance_body" text;

ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "meta_title" text;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "meta_description" text;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "og_image" text;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "canonical_url" text;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "no_index" boolean DEFAULT false;
