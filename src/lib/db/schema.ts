import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* -------------------------------------------------------------------------- */
/* Better Auth (required by the app; not part of the content CMS spec)        */
/* -------------------------------------------------------------------------- */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  role: text("role").default("author").notNull(),
  suspended: boolean("suspended").default(false).notNull(),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

/** Single-use staff invitations (signup stays disabled). */
export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    role: text("role").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    invitedByUserId: text("invited_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    expiresAt: timestamp("expires_at").notNull(),
    acceptedAt: timestamp("accepted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("invitations_email_idx").on(table.email),
    index("invitations_expires_at_idx").on(table.expiresAt),
  ],
);

export const twoFactor = pgTable("two_factor", {
  id: text("id").primaryKey(),
  secret: text("secret").notNull(),
  backupCodes: text("backup_codes").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  verified: boolean("verified").default(false),
  // Required by better-auth >= 1.6 (verification lockout).
  failedVerificationCount: integer("failed_verification_count").default(0),
  lockedUntil: timestamp("locked_until"),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

/* -------------------------------------------------------------------------- */
/* Shared SEO columns                                                         */
/* -------------------------------------------------------------------------- */

export const seoColumns = {
  metaTitle: text("meta_title").notNull(),
  metaDescription: text("meta_description").notNull(),
  canonicalUrl: text("canonical_url"),
  ogImage: text("og_image"),
  schemaType: text("schema_type").default("WebPage"),
  noIndex: boolean("no_index").default(false),
  focusKeyword: text("focus_keyword"),
  secondaryKeywords: text("secondary_keywords"),
  schemaJson: jsonb("schema_json"),
  sitemapInclude: boolean("sitemap_include").default(true),
  sitemapPriority: numeric("sitemap_priority", { precision: 2, scale: 1 }).default(
    "0.7",
  ),
};

/* -------------------------------------------------------------------------- */
/* Taxonomy                                                                   */
/* -------------------------------------------------------------------------- */

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  focusKeyword: text("focus_keyword"),
  secondaryKeywords: text("secondary_keywords"),
  noIndex: boolean("no_index").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  focusKeyword: text("focus_keyword"),
  secondaryKeywords: text("secondary_keywords"),
  noIndex: boolean("no_index").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* -------------------------------------------------------------------------- */
/* Content                                                                    */
/* -------------------------------------------------------------------------- */

export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  content: jsonb("content"),
  coverImage: text("cover_image"),
  status: text("status").default("draft"),
  publishedAt: timestamp("published_at"),
  scheduledFor: timestamp("scheduled_for"),
  updatedAt: timestamp("updated_at").defaultNow(),
  authorId: text("author_id"),
  readingMinutes: integer("reading_minutes"),
  tldr: text("tldr"),
  keyTakeaways: jsonb("key_takeaways"),
  postFaqs: jsonb("post_faqs"),
  // Legacy denormalized fields kept for gradual migration / admin display
  category: text("category"),
  tags: jsonb("tags").$type<string[]>(),
  socialTitle: text("social_title"),
  socialDescription: text("social_description"),
  noFollow: boolean("no_follow").default(false),
  noArchive: boolean("no_archive").default(false),
  ...seoColumns,
});

export const pages = pgTable("pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  /** Full public path, e.g. /about-us or /services/wordpress-development/pricing */
  path: text("path").unique(),
  title: text("title").notNull(),
  content: jsonb("content"),
  /** Structured landing sections (same shape as services). */
  pageSections: jsonb("page_sections"),
  /** Admin-managed hero visual (animation|media) for the right-side hero slot. */
  heroVisual: jsonb("hero_visual"),
  heroEyebrow: text("hero_eyebrow"),
  heroSubtext: text("hero_subtext"),
  showCta: boolean("show_cta").default(true),
  /** marketing | article — marketing uses section template */
  template: text("template").default("marketing"),
  parentId: uuid("parent_id"),
  parentServiceId: uuid("parent_service_id"),
  status: text("status").default("draft"),
  publishedAt: timestamp("published_at"),
  scheduledFor: timestamp("scheduled_for"),
  updatedAt: timestamp("updated_at").defaultNow(),
  authorId: text("author_id"),
  ...seoColumns,
});

export const landingPages = pgTable("landing_pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  /** Full public path, e.g. /cpa-marketing-agency-houston */
  path: text("path").unique(),
  title: text("title").notNull(),
  content: jsonb("content"),
  /** Structured landing sections (same shape as services/pages). */
  pageSections: jsonb("page_sections"),
  /** Admin-managed hero visual (animation|media) for the right-side hero slot. */
  heroVisual: jsonb("hero_visual"),
  /**
   * marketing — ServiceDetailTemplate in landing chrome.
   * custom — dedicated coded template (e.g. Houston CPA).
   */
  layoutKind: text("layout_kind").default("marketing"),
  status: text("status").default("draft"),
  publishedAt: timestamp("published_at"),
  scheduledFor: timestamp("scheduled_for"),
  updatedAt: timestamp("updated_at").defaultNow(),
  authorId: text("author_id"),
  ...seoColumns,
});

export const caseStudies = pgTable("case_studies", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  client: text("client").notNull(),
  pageHeading: text("page_heading"),
  industry: text("industry"),
  website: text("website"),
  engagementType: text("engagement_type"),
  servicesProvided: text("services_provided"),
  location: text("location"),
  platformStack: text("platform_stack"),
  infoHeadlineLabel: text("info_headline_label"),
  infoHeadlineValue: text("info_headline_value"),
  infoDetails: jsonb("info_details"),
  challenge: text("challenge"),
  challengeMedia: text("challenge_media"),
  approach: jsonb("approach"),
  approachMedia: text("approach_media"),
  solution: jsonb("solution"),
  solutionMedia: text("solution_media"),
  clientNoticed: jsonb("client_noticed"),
  clientNoticedMedia: text("client_noticed_media"),
  sectionLabels: jsonb("section_labels"),
  gallery: jsonb("gallery"),
  clientQuote: jsonb("client_quote"),
  serviceSlugs: jsonb("service_slugs").$type<string[]>(),
  status: text("status").default("draft"),
  publishedAt: timestamp("published_at"),
  scheduledFor: timestamp("scheduled_for"),
  updatedAt: timestamp("updated_at").defaultNow(),
  authorId: text("author_id"),
  ...seoColumns,
});

export const postCategories = pgTable(
  "post_categories",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.postId, table.categoryId] })],
);

export const postTags = pgTable(
  "post_tags",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.postId, table.tagId] })],
);

export const caseStudyCategories = pgTable(
  "case_study_categories",
  {
    caseStudyId: uuid("case_study_id")
      .notNull()
      .references(() => caseStudies.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.caseStudyId, table.categoryId] })],
);

export const services = pgTable(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    shortPitch: text("short_pitch"),
    body: jsonb("body"),
    /** Structured service landing sections (mirrors StaticServicePage body). */
    pageSections: jsonb("page_sections"),
    /** Admin-managed hero visual (animation|media) for the right-side hero slot. */
    heroVisual: jsonb("hero_visual"),
    deliverables: jsonb("deliverables"),
    faqs: jsonb("faqs"),
    icon: text("icon"),
    sortOrder: integer("sort_order").default(0),
    status: text("status").default("published"),
    publishedAt: timestamp("published_at"),
    scheduledFor: timestamp("scheduled_for"),
    /** Optional parent service for hierarchy (child under /services/{parent}/{slug}). */
    parentId: uuid("parent_id"),
    socialTitle: text("social_title"),
    socialDescription: text("social_description"),
    noFollow: boolean("no_follow").default(false),
    noArchive: boolean("no_archive").default(false),
    updatedAt: timestamp("updated_at").defaultNow(),
    ...seoColumns,
  },
  (table) => [index("services_parent_id_idx").on(table.parentId)],
);

export const testimonials = pgTable("testimonials", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientName: text("client_name").notNull(),
  company: text("company"),
  role: text("role"),
  quote: text("quote").notNull(),
  rating: integer("rating").default(5),
  resultMetric: text("result_metric"),
  headshot: text("headshot"),
  videoUrl: text("video_url"),
  serviceTag: text("service_tag"),
  featured: boolean("featured").default(false),
  sortOrder: integer("sort_order").default(0),
  status: text("status").default("published"),
});

export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  url: text("url").notNull(),
  alt: text("alt").notNull(),
  width: integer("width"),
  height: integer("height"),
  mimeType: text("mime_type"),
  filename: text("filename"),
  sizeBytes: integer("size_bytes"),
  folder: text("folder").default("uploads"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").notNull(),
  company: text("company"),
  message: text("message"),
  source: text("source"),
  path: text("path"),
  status: text("status").default("new"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const redirects = pgTable("redirects", {
  id: uuid("id").primaryKey().defaultRandom(),
  fromPath: text("from_path").notNull().unique(),
  toPath: text("to_path").notNull(),
  permanent: boolean("permanent").default(true),
  hits: integer("hits").default(0),
});

export const menus = pgTable("menus", {
  id: uuid("id").primaryKey().defaultRandom(),
  location: text("location").notNull().unique(),
  items: jsonb("items")
    .$type<
      {
        label: string;
        href: string;
        order: number;
        children?: { label: string; href: string; order: number }[];
      }[]
    >()
    .notNull()
    .default([]),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const siteSettings = pgTable("site_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationName: text("organization_name"),
  tagline: text("tagline"),
  defaultOgImage: text("default_og_image"),
  socialLinks: jsonb("social_links"),
  announcementText: text("announcement_text"),
  announcementEnabled: boolean("announcement_enabled").default(false),
  contactEmail: text("contact_email"),
  ga4Id: text("ga4_id"),
  clarityId: text("clarity_id"),
  indexNowKey: text("index_now_key"),
  sitemapExcludedPaths: jsonb("sitemap_excluded_paths").$type<string[]>(),
  consentEnabled: boolean("consent_enabled").default(true),
  consentBannerText: text("consent_banner_text"),
  consentAcceptLabel: text("consent_accept_label"),
  consentDeclineLabel: text("consent_decline_label"),
  consentPolicyLinkLabel: text("consent_policy_link_label"),
  consentPolicyLinkHref: text("consent_policy_link_href"),
  consentPosition: text("consent_position").default("bottom-bar"),
  consentReshowAfterDays: integer("consent_reshow_after_days").default(365),
  maintenanceMode: boolean("maintenance_mode").default(false),
  maintenanceTitle: text("maintenance_title"),
  maintenanceBody: text("maintenance_body"),
  logoUrl: text("logo_url"),
  defaultTheme: text("default_theme").default("dark"),
});

export type PopupTrigger = {
  delaySeconds?: number;
  scrollPercent?: number;
};

export type PopupAudience = {
  pages?: string[];
  devices?: "all" | "desktop" | "mobile";
};

export type PopupContent = {
  heading: string;
  body: string;
  imageUrl?: string;
  ctaLabel?: string;
  ctaHref?: string;
  formEnabled?: boolean;
  formSource?: string;
};

export const popups = pgTable(
  "popups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    status: text("status").notNull().default("paused"),
    type: text("type").notNull(),
    trigger: jsonb("trigger").$type<PopupTrigger>().notNull().default({}),
    audience: jsonb("audience").$type<PopupAudience>().notNull().default({}),
    frequency: text("frequency").notNull().default("once-per-session"),
    priority: integer("priority").notNull().default(0),
    content: jsonb("content").$type<PopupContent>().notNull().default({
      heading: "",
      body: "",
    }),
    displayFrom: timestamp("display_from"),
    displayUntil: timestamp("display_until"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("popups_status_priority_idx").on(table.status, table.priority)],
);

export type ContentBlockValue =
  | { text: string }
  | { url: string; alt?: string }
  /** Link button: label + href + enabled (see lib/content/link-button). */
  | { label: string; href: string; enabled: boolean };

export const contentBlocks = pgTable(
  "content_blocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: text("key").notNull().unique(),
    label: text("label").notNull(),
    group: text("group").notNull(),
    type: text("type").notNull(),
    value: jsonb("value").$type<ContentBlockValue>().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("content_blocks_group_idx").on(table.group)],
);

export const revisions = pgTable(
  "revisions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    snapshot: jsonb("snapshot").notNull(),
    authorId: text("author_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("revisions_entity_idx").on(table.entityType, table.entityId),
    index("revisions_created_at_idx").on(table.createdAt),
  ],
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id"),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    meta: jsonb("meta"),
    ip: text("ip"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("audit_log_created_at_idx").on(table.createdAt),
    index("audit_log_entity_idx").on(table.entityType, table.entityId),
  ],
);

/* -------------------------------------------------------------------------- */
/* Careers (existing product feature)                                         */
/* -------------------------------------------------------------------------- */

export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  department: text("department"),
  location: text("location"),
  employmentType: text("employment_type").notNull().default("full-time"),
  description: jsonb("description"),
  requirements: text("requirements"),
  salaryRange: text("salary_range"),
  status: text("status").notNull().default("draft"),
  sortOrder: integer("sort_order").notNull().default(0),
  publishedAt: timestamp("published_at"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  ogImage: text("og_image"),
  canonicalUrl: text("canonical_url"),
  noIndex: boolean("no_index").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const jobApplications = pgTable(
  "job_applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    linkedinUrl: text("linkedin_url"),
    coverLetter: text("cover_letter"),
    resumeUrl: text("resume_url").notNull(),
    resumeFilename: text("resume_filename"),
    status: text("status").notNull().default("new"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("job_applications_jobId_idx").on(table.jobId)],
);

export const jobsRelations = relations(jobs, ({ many }) => ({
  applications: many(jobApplications),
}));

export const jobApplicationsRelations = relations(jobApplications, ({ one }) => ({
  job: one(jobs, {
    fields: [jobApplications.jobId],
    references: [jobs.id],
  }),
}));

export const postsRelations = relations(posts, ({ many }) => ({
  postCategories: many(postCategories),
  postTags: many(postTags),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  postCategories: many(postCategories),
  caseStudyCategories: many(caseStudyCategories),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  postTags: many(postTags),
}));

export const postCategoriesRelations = relations(postCategories, ({ one }) => ({
  post: one(posts, {
    fields: [postCategories.postId],
    references: [posts.id],
  }),
  category: one(categories, {
    fields: [postCategories.categoryId],
    references: [categories.id],
  }),
}));

export const postTagsRelations = relations(postTags, ({ one }) => ({
  post: one(posts, {
    fields: [postTags.postId],
    references: [posts.id],
  }),
  tag: one(tags, {
    fields: [postTags.tagId],
    references: [tags.id],
  }),
}));

export const workGallery = pgTable("work_gallery", {
  id: uuid("id").primaryKey().defaultRandom(),
  url: text("url").notNull(),
  alt: text("alt").default("").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const caseStudiesRelations = relations(caseStudies, ({ many }) => ({
  caseStudyCategories: many(caseStudyCategories),
}));

export const caseStudyCategoriesRelations = relations(
  caseStudyCategories,
  ({ one }) => ({
    caseStudy: one(caseStudies, {
      fields: [caseStudyCategories.caseStudyId],
      references: [caseStudies.id],
    }),
    category: one(categories, {
      fields: [caseStudyCategories.categoryId],
      references: [categories.id],
    }),
  }),
);

/** @deprecated Prefer `menus` jsonb table. Kept so existing rows are not lost mid-migrate. */
export const menuItems = pgTable(
  "menu_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    location: text("location").notNull(),
    label: text("label").notNull(),
    href: text("href").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    enabled: boolean("enabled").notNull().default(true),
    footerColumn: text("footer_column"),
    parentId: uuid("parent_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("menu_items_location_idx").on(table.location),
    index("menu_items_parent_idx").on(table.parentId),
  ],
);
