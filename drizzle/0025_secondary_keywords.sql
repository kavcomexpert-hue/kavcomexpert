-- Ensure secondary_keywords exists on SEO-bearing tables (idempotent).
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "secondary_keywords" text;
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "secondary_keywords" text;
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "secondary_keywords" text;
ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "secondary_keywords" text;
