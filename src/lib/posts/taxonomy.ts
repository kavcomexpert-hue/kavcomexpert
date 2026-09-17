import slugify from "slugify";

export function slugifyTaxonomy(value: string): string {
  return (
    slugify(value, {
      lower: true,
      strict: true,
      trim: true,
    }) || "item"
  );
}

export function humanizeTaxonomySlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part, index) =>
      index === 0
        ? part.charAt(0).toUpperCase() + part.slice(1)
        : part.toLowerCase(),
    )
    .join(" ");
}
