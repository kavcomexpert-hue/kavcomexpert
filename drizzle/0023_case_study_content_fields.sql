ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "approach" jsonb;
ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "client_noticed" jsonb;
