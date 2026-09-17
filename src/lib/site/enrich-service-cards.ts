import { servicePathsById } from "@/lib/paths";

type DbServiceRow = {
  id: string;
  slug: string;
  name: string;
  shortPitch: string | null;
  parentId?: string | null;
};

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/\bservices?\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export type EnrichServiceCardsOptions = {
  /**
   * When true, keep a non-empty card description (e.g. home pageSections)
   * instead of overwriting it with services.shortPitch.
   */
  preferCardDescription?: boolean;
};

/**
 * Overlay DB service fields onto a designed card list.
 * Cards match a CMS service by slug first, then by normalized name, so an
 * admin slug rename still resolves to the live URL. Hrefs are built with the
 * canonical path builders (nested when the service has a parent).
 * Preserves order, icons, and cards that are not yet in the CMS.
 */
export function enrichServiceCardsBySlug<
  T extends { name: string; href: string; description: string },
>(
  defaults: readonly T[],
  dbServices: readonly DbServiceRow[],
  options?: EnrichServiceCardsOptions,
): T[] {
  const preferCardDescription = Boolean(options?.preferCardDescription);
  const bySlug = new Map(dbServices.map((service) => [service.slug, service]));
  const byName = new Map(
    dbServices.map((service) => [normalizeName(service.name), service]),
  );
  const pathById = servicePathsById(dbServices);

  return defaults.map((item) => {
    const slug = item.href.split("/").filter(Boolean).pop() ?? "";
    const match = bySlug.get(slug) ?? byName.get(normalizeName(item.name));
    if (!match) return item;

    const cardDescription = item.description.trim();
    const description =
      preferCardDescription && cardDescription
        ? item.description
        : match.shortPitch?.trim() || item.description;

    return {
      ...item,
      name: match.name,
      href: pathById.get(match.id) ?? item.href,
      description,
    };
  });
}
