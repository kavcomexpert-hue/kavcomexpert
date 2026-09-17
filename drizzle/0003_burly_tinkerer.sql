CREATE TABLE "pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"content" jsonb,
	"hero_eyebrow" text,
	"hero_subtext" text,
	"show_cta" boolean DEFAULT true,
	"status" text DEFAULT 'draft',
	"updated_at" timestamp DEFAULT now(),
	"meta_title" text NOT NULL,
	"meta_description" text NOT NULL,
	"canonical_url" text,
	"og_image" text,
	"schema_type" text DEFAULT 'WebPage',
	"no_index" boolean DEFAULT false,
	CONSTRAINT "pages_slug_unique" UNIQUE("slug")
);
