-- Standalone landing pages (admin Landing pages tab).
-- Same content shape as marketing pages/services, served under (landing) chrome.
CREATE TABLE IF NOT EXISTS "landing_pages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "path" text UNIQUE,
  "title" text NOT NULL,
  "content" jsonb,
  "page_sections" jsonb,
  "hero_visual" jsonb,
  "layout_kind" text DEFAULT 'marketing',
  "status" text DEFAULT 'draft',
  "published_at" timestamp,
  "scheduled_for" timestamp,
  "updated_at" timestamp DEFAULT now(),
  "author_id" text,
  "meta_title" text NOT NULL,
  "meta_description" text NOT NULL,
  "canonical_url" text,
  "og_image" text,
  "schema_type" text DEFAULT 'WebPage',
  "no_index" boolean DEFAULT false,
  "focus_keyword" text,
  "secondary_keywords" text,
  "schema_json" jsonb,
  "sitemap_include" boolean DEFAULT true,
  "sitemap_priority" numeric(2, 1) DEFAULT '0.7'
);
