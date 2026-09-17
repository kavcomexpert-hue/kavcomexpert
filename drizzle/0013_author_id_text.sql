-- author_id must match Better Auth user.id (text), not uuid
ALTER TABLE "posts" ALTER COLUMN "author_id" TYPE text USING "author_id"::text;--> statement-breakpoint
ALTER TABLE "pages" ALTER COLUMN "author_id" TYPE text USING "author_id"::text;--> statement-breakpoint
ALTER TABLE "case_studies" ALTER COLUMN "author_id" TYPE text USING "author_id"::text;--> statement-breakpoint
ALTER TABLE "revisions" ALTER COLUMN "author_id" TYPE text USING "author_id"::text;
