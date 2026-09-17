ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "services_provided" text;
ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "location" text;
ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "platform_stack" text;
