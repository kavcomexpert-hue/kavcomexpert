ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "published_at" timestamp;
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "scheduled_for" timestamp;
ALTER TABLE "services" DROP COLUMN IF EXISTS "starting_price";
