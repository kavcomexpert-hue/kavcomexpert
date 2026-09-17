-- Expand SEO + content CMS schema
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "scheduled_for" timestamp;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "author_id" uuid;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "sitemap_include" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "sitemap_priority" numeric(2, 1) DEFAULT 0.7;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "published_at" timestamp;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "scheduled_for" timestamp;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "author_id" uuid;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "focus_keyword" text;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "sitemap_include" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "sitemap_priority" numeric(2, 1) DEFAULT 0.7;--> statement-breakpoint
ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "client_quote" jsonb;--> statement-breakpoint
ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "service_slugs" jsonb;--> statement-breakpoint
ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "published_at" timestamp;--> statement-breakpoint
ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "scheduled_for" timestamp;--> statement-breakpoint
ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "author_id" uuid;--> statement-breakpoint
ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "sitemap_include" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "case_studies" ADD COLUMN IF NOT EXISTS "sitemap_priority" numeric(2, 1) DEFAULT 0.7;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "sitemap_include" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "sitemap_priority" numeric(2, 1) DEFAULT 0.7;--> statement-breakpoint
ALTER TABLE "testimonials" ADD COLUMN IF NOT EXISTS "video_url" text;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "folder" text DEFAULT 'uploads';--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'new';--> statement-breakpoint
ALTER TABLE "redirects" ADD COLUMN IF NOT EXISTS "hits" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "tagline" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "contact_email" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "ga4_id" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "clarity_id" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "index_now_key" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "sitemap_excluded_paths" jsonb;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "post_categories" (
	"post_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	CONSTRAINT "post_categories_post_id_category_id_pk" PRIMARY KEY("post_id","category_id")
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "post_tags" (
	"post_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "post_tags_post_id_tag_id_pk" PRIMARY KEY("post_id","tag_id")
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "case_study_categories" (
	"case_study_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	CONSTRAINT "case_study_categories_case_study_id_category_id_pk" PRIMARY KEY("case_study_id","category_id")
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"snapshot" jsonb NOT NULL,
	"author_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "revisions_entity_idx" ON "revisions" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "revisions_created_at_idx" ON "revisions" USING btree ("created_at");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "menus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location" text NOT NULL UNIQUE,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now()
);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "post_categories" ADD CONSTRAINT "post_categories_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "post_categories" ADD CONSTRAINT "post_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "case_study_categories" ADD CONSTRAINT "case_study_categories_case_study_id_case_studies_id_fk" FOREIGN KEY ("case_study_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "case_study_categories" ADD CONSTRAINT "case_study_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
-- Backfill published_at on published case studies / pages
UPDATE "case_studies" SET "published_at" = COALESCE("published_at", now()) WHERE "status" = 'published' AND "published_at" IS NULL;--> statement-breakpoint
UPDATE "pages" SET "published_at" = COALESCE("published_at", now()) WHERE "status" = 'published' AND "published_at" IS NULL;--> statement-breakpoint
-- Migrate denormalized post.category → post_categories
INSERT INTO "post_categories" ("post_id", "category_id")
SELECT p."id", c."id"
FROM "posts" p
JOIN "categories" c ON c."slug" = p."category"
WHERE p."category" IS NOT NULL AND p."category" <> ''
ON CONFLICT DO NOTHING;--> statement-breakpoint
-- Migrate denormalized post.tags jsonb → post_tags (match by slug or name)
INSERT INTO "post_tags" ("post_id", "tag_id")
SELECT p."id", t."id"
FROM "posts" p
CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(p."tags", '[]'::jsonb)) AS tag_name(value)
JOIN "tags" t ON t."slug" = tag_name.value OR t."name" = tag_name.value
ON CONFLICT DO NOTHING;
