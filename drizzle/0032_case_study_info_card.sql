ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "website" text;
ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "engagement_type" text;
ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "info_headline_label" text;
ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "info_headline_value" text;
ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "info_details" jsonb;
ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "section_labels" jsonb;
ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "challenge_media" text;
ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "approach_media" text;
ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "solution_media" text;
ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "client_noticed_media" text;

UPDATE "case_studies"
SET "engagement_type" = "timeline"
WHERE "engagement_type" IS NULL
  AND "timeline" IS NOT NULL
  AND btrim("timeline") <> '';

ALTER TABLE "case_studies" DROP COLUMN IF EXISTS "results";
ALTER TABLE "case_studies" DROP COLUMN IF EXISTS "timeline";
