/**
 * Hand-written metadata for static public routes.
 * Review and edit titles/descriptions here in one place.
 */
export type StaticMetaEntry = {
  title: string;
  description: string;
  path: string;
  /** Sitemap priority for this static route (0–1). */
  sitemapPriority?: number;
};

export const staticPageMeta = {
  home: {
    title: "Kavcom Expert | Full-Service Digital Agency",
    description:
      "Innovative solutions for digital marketing, WordPress, Shopify, and WooCommerce. Scalable websites and data-driven marketing that deliver measurable results.",
    path: "/",
    sitemapPriority: 1,
  },
  about: {
    title: "About Us | Kavcom Expert",
    description:
      "Learn about Kavcom Expert, a full-service digital agency crafting websites, apps, SEO, and marketing that elevate brands and drive measurable growth.",
    path: "/about-us",
    sitemapPriority: 0.6,
  },
  blog: {
    title: "Blog | Kavcom Expert",
    description:
      "Insights on SEO, web development, e-commerce, and digital marketing from the Kavcom Expert team.",
    path: "/blog",
    sitemapPriority: 0.8,
  },
  services: {
    title: "Services | Kavcom Expert",
    description:
      "Web and app development, e-commerce, digital marketing, SEO, and cloud services, complete digital solutions from a single expert team.",
    path: "/services",
    sitemapPriority: 0.8,
  },
  work: {
    title: "Work | Kavcom Expert",
    description:
      "Selected websites, growth systems, and brand projects from Kavcom Expert. A living portfolio of shipped work.",
    path: "/work",
    sitemapPriority: 0.8,
  },
  contact: {
    title: "Contact | Kavcom Expert",
    description:
      "Send a message to Kavcom Expert about websites, SEO, ads, and growth. We reply within one business day.",
    path: "/contact-us",
    sitemapPriority: 0.6,
  },
  careers: {
    title: "Careers | Kavcom Expert",
    description:
      "Join Kavcom Expert. We're hiring talented engineers, marketers, and strategists who want to build things that matter.",
    path: "/careers",
    sitemapPriority: 0.7,
  },
  houstonCpa: {
    title: "CPA Marketing Agency Houston | Kavcom Expert",
    description:
      "Marketing and back office support for Houston CPA firms. Websites, local SEO, AEO, social, and VA support. Book a free fit call.",
    path: "/cpa-marketing-agency-houston",
    sitemapPriority: 0.9,
  },
  /** AI / agent discovery endpoints (llms.txt convention). */
  llmsTxt: {
    title: "llms.txt | Kavcom Expert",
    description: "Machine-readable site summary for AI assistants and agents.",
    path: "/llms.txt",
    sitemapPriority: 0.4,
  },
  llmsFull: {
    title: "llms-full | Kavcom Expert",
    description: "Full post index with TL;DR summaries for AI systems.",
    path: "/llms-full",
    sitemapPriority: 0.3,
  },
  feed: {
    title: "RSS | Kavcom Expert",
    description: "RSS feed of published blog posts.",
    path: "/feed.xml",
    sitemapPriority: 0.3,
  },
} as const satisfies Record<string, StaticMetaEntry>;

export type StaticMetaKey = keyof typeof staticPageMeta;

export function getStaticPageMeta(key: StaticMetaKey): StaticMetaEntry {
  return staticPageMeta[key];
}

/** Flat list of static routes for sitemap generation. */
export function getStaticSitemapRoutes(): {
  path: string;
  priority: number;
}[] {
  return Object.values(staticPageMeta).map((entry) => ({
    path: entry.path,
    priority: entry.sitemapPriority ?? 0.5,
  }));
}
