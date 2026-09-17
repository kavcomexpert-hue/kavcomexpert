ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "parent_id" uuid;--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "services" ADD CONSTRAINT "services_parent_id_services_id_fk"
    FOREIGN KEY ("parent_id") REFERENCES "public"."services"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "services_parent_id_idx" ON "services" ("parent_id");--> statement-breakpoint
