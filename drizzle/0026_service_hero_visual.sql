-- Admin-managed hero visuals for single-service pages.
-- mode: "animation" (default) or "media"
-- mediaUrl: optional URL (stored as string) when mode="media"
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "hero_visual" jsonb;

-- Better Auth only flips twoFactorEnabled when verified !== true.
-- A DB default of true caused verifyTotp to succeed without enabling 2FA.
ALTER TABLE "two_factor" ALTER COLUMN "verified" SET DEFAULT false;
UPDATE "two_factor" SET "verified" = false WHERE "verified" IS NULL;

