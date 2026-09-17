export const TESTIMONIAL_SERVICE_TAGS = [
  "SEO",
  "Web Development",
  "AEO/GEO",
  "Social Media",
] as const;

export type TestimonialServiceTag = (typeof TESTIMONIAL_SERVICE_TAGS)[number];

export const SERVICE_ICONS = [
  "search",
  "code",
  "sparkles",
  "share-2",
  "briefcase",
  "layers",
  "globe",
  "chart-line",
  "megaphone",
  "target",
] as const;

export type ServiceIcon = (typeof SERVICE_ICONS)[number];

export const STATUS_OPTIONS = ["draft", "published"] as const;

export type ContentStatus = (typeof STATUS_OPTIONS)[number];
