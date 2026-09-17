ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "maintenance_mode" boolean DEFAULT false;
