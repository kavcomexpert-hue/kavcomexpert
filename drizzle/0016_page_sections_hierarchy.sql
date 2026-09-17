-- Page sections + hierarchy
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "page_sections" jsonb;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "parent_service_id" uuid;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "path" text;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "template" text DEFAULT 'marketing';--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "pages" ADD CONSTRAINT "pages_parent_id_pages_id_fk"
    FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "pages" ADD CONSTRAINT "pages_parent_service_id_services_id_fk"
    FOREIGN KEY ("parent_service_id") REFERENCES "public"."services"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "pages_path_unique" ON "pages" ("path");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pages_parent_id_idx" ON "pages" ("parent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pages_parent_service_id_idx" ON "pages" ("parent_service_id");--> statement-breakpoint

-- Backfill path from slug for existing rows
UPDATE "pages" SET "path" = '/' || "slug" WHERE "path" IS NULL;--> statement-breakpoint
