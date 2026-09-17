-- Admin-managed hero visuals for CMS marketing pages (same shape as services).
-- mode: "animation" (default) or "media"
-- mediaUrl: optional URL when mode="media"
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "hero_visual" jsonb;
