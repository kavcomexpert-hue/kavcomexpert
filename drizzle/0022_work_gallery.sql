CREATE TABLE IF NOT EXISTS "work_gallery" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "url" text NOT NULL,
  "alt" text DEFAULT '' NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

INSERT INTO "work_gallery" ("url", "alt", "sort_order")
VALUES
  ('/blog-media/KavCom-Expert-Logo-Black-ed2a6e8fa63ccf82.png', 'Kavcom Expert project showcase', 0),
  ('/blog-media/Dashboard-115d51468c2350a5.png', 'Dashboard interface preview', 1),
  ('/blog-media/Ecommerce-trends-2026-3409a684abc83b91.png', 'E-commerce project visual', 2),
  ('/logos/client-01.png', 'Client brand work sample', 3),
  ('/logos/bertram-financial.webp', 'Financial services brand project', 4);
