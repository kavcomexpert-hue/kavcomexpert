-- Prevent duplicate menu rows from concurrent seed races
CREATE UNIQUE INDEX IF NOT EXISTS "menu_items_header_uidx"
ON "menu_items" ("href")
WHERE "location" = 'header' AND "parent_id" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "menu_items_footer_uidx"
ON "menu_items" ("footer_column", "href")
WHERE "location" = 'footer' AND "parent_id" IS NULL;
