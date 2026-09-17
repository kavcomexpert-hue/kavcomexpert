CREATE TABLE "case_studies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"client" text NOT NULL,
	"industry" text,
	"challenge" text,
	"solution" jsonb,
	"results" jsonb,
	"timeline" text,
	"gallery" jsonb,
	"status" text DEFAULT 'draft',
	"meta_title" text NOT NULL,
	"meta_description" text NOT NULL,
	"canonical_url" text,
	"og_image" text,
	"schema_type" text DEFAULT 'WebPage',
	"no_index" boolean DEFAULT false,
	CONSTRAINT "case_studies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"company" text,
	"message" text,
	"source" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"alt" text NOT NULL,
	"width" integer,
	"height" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"content" jsonb,
	"cover_image" text,
	"category" text,
	"status" text DEFAULT 'draft',
	"published_at" timestamp,
	"updated_at" timestamp DEFAULT now(),
	"reading_minutes" integer,
	"focus_keyword" text,
	"meta_title" text NOT NULL,
	"meta_description" text NOT NULL,
	"canonical_url" text,
	"og_image" text,
	"schema_type" text DEFAULT 'WebPage',
	"no_index" boolean DEFAULT false,
	CONSTRAINT "posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "redirects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_path" text NOT NULL,
	"to_path" text NOT NULL,
	"permanent" boolean DEFAULT true,
	CONSTRAINT "redirects_from_path_unique" UNIQUE("from_path")
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"short_pitch" text,
	"body" jsonb,
	"deliverables" jsonb,
	"starting_price" text,
	"faqs" jsonb,
	"icon" text,
	"sort_order" integer DEFAULT 0,
	"status" text DEFAULT 'published',
	"meta_title" text NOT NULL,
	"meta_description" text NOT NULL,
	"canonical_url" text,
	"og_image" text,
	"schema_type" text DEFAULT 'WebPage',
	"no_index" boolean DEFAULT false,
	CONSTRAINT "services_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_name" text,
	"default_og_image" text,
	"social_links" jsonb,
	"announcement_text" text,
	"announcement_enabled" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_name" text NOT NULL,
	"company" text,
	"role" text,
	"quote" text NOT NULL,
	"rating" integer DEFAULT 5,
	"result_metric" text,
	"headshot" text,
	"service_tag" text,
	"featured" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"status" text DEFAULT 'published'
);
