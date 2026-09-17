ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "consent_enabled" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "consent_banner_text" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "consent_accept_label" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "consent_decline_label" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "consent_policy_link_label" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "consent_policy_link_href" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "consent_position" text DEFAULT 'bottom-bar';--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "consent_reshow_after_days" integer DEFAULT 365;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "popups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'paused' NOT NULL,
	"type" text NOT NULL,
	"trigger" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"audience" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"frequency" text DEFAULT 'once-per-session' NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"display_from" timestamp,
	"display_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "popups_status_priority_idx" ON "popups" ("status","priority");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "content_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"group" text NOT NULL,
	"type" text NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "content_blocks_key_unique" UNIQUE("key")
);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "content_blocks_group_idx" ON "content_blocks" ("group");
