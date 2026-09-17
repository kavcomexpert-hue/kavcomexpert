import { getDb } from "@/lib/db";
import {
  jobs,
  menuItems,
  menus,
  pages,
  posts,
  services,
} from "@/lib/db/schema";
import {
  blogIndexPath,
  jobPath,
  pagePath,
  postPath,
  servicePath,
  servicePathsById,
  servicesIndexPath,
  workIndexPath,
} from "@/lib/paths";
import {
  companyNavItems,
  primaryNavItems,
} from "@/lib/site/nav";
import type { NavItem } from "@/lib/site/nav";
import { asc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export const MENU_LOCATIONS = [
  "header",
  "footer-services",
  "footer-growth",
  "footer-company",
] as const;

export type MenuLocation = (typeof MENU_LOCATIONS)[number];

export type MenuJsonItem = {
  label: string;
  href: string;
  order: number;
  children?: { label: string; href: string; order: number }[];
};

export type MenuLinkOption = {
  label: string;
  href: string;
  group: "Site" | "Pages" | "Services" | "Posts" | "Careers";
};

export type AdminMenuItem = MenuJsonItem & { clientId: string };

function isMissingRelationError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const cause = "cause" in error ? error.cause : error;
  if (!cause || typeof cause !== "object") return false;
  return (
    ("code" in cause && cause.code === "42P01") ||
    ("message" in cause &&
      typeof cause.message === "string" &&
      cause.message.includes("does not exist"))
  );
}

function sortByOrder<T extends { order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order);
}

function toClientItems(items: MenuJsonItem[]): AdminMenuItem[] {
  return sortByOrder(items).map((item, index) => ({
    ...item,
    order: index,
    clientId: `item-${index}-${item.href}-${item.label}`,
    children: sortByOrder(item.children ?? []).map((child, childIndex) => ({
      ...child,
      order: childIndex,
    })),
  }));
}

function defaultHeaderItems(): MenuJsonItem[] {
  return primaryNavItems.map((item, index) => ({
    label: item.label,
    href: item.href,
    order: index,
  }));
}

function defaultFooterServices(): MenuJsonItem[] {
  return [
    { label: "WordPress Development", href: servicePath({ slug: "wordpress-development" }), order: 0 },
    { label: "Shopify Development", href: servicePath({ slug: "shopify-development" }), order: 1 },
    { label: "Magento Development", href: servicePath({ slug: "magento-development" }), order: 2 },
    { label: "Migration Services", href: servicePath({ slug: "migration-services" }), order: 3 },
  ];
}

function defaultFooterCompany(): MenuJsonItem[] {
  return companyNavItems
    .filter((item) => item.href !== "/contact-us")
    .map((item, index) => ({
      label: item.label === "Careers" ? "Career" : item.label,
      href: item.href,
      order: index,
    }));
}

function defaultFooterGrowth(): MenuJsonItem[] {
  return [
    {
      label: "Digital Marketing Services",
      href: servicePath({ slug: "digital-marketing" }),
      order: 0,
    },
    {
      label: "Virtual Assistant Support",
      href: servicePath({ slug: "virtual-assistant" }),
      order: 1,
    },
    {
      label: "SEO & AI SEO Optimization",
      href: servicePath({ slug: "seo-ai-optimization" }),
      order: 2,
    },
    {
      label: "Video Editing",
      href: servicePath({ slug: "video-editing" }),
      order: 3,
    },
  ];
}

function staticFooterMenus() {
  return {
    services: defaultFooterServices().map((item, index) => ({
      id: `static-services-${index}`,
      label: item.label,
      href: item.href,
    })),
    growth: defaultFooterGrowth().map((item, index) => ({
      id: `static-growth-${index}`,
      label: item.label,
      href: item.href,
    })),
    company: defaultFooterCompany().map((item, index) => ({
      id: `static-company-${index}`,
      label: item.label,
      href: item.href,
    })),
  };
}

async function fetchJsonMenu(location: MenuLocation): Promise<MenuJsonItem[] | null> {
  try {
    const [row] = await getDb()
      .select({ items: menus.items })
      .from(menus)
      .where(eq(menus.location, location))
      .limit(1);

    if (!row) return null;
    return Array.isArray(row.items) ? sortByOrder(row.items) : [];
  } catch (error) {
    if (isMissingRelationError(error)) return null;
    throw error;
  }
}

async function fetchLegacyMenuItems(location: "header" | "footer") {
  try {
    return await getDb()
      .select({
        id: menuItems.id,
        location: menuItems.location,
        label: menuItems.label,
        href: menuItems.href,
        sortOrder: menuItems.sortOrder,
        enabled: menuItems.enabled,
        footerColumn: menuItems.footerColumn,
        parentId: menuItems.parentId,
      })
      .from(menuItems)
      .where(eq(menuItems.location, location))
      .orderBy(asc(menuItems.sortOrder), asc(menuItems.label));
  } catch (error) {
    if (isMissingRelationError(error)) return [];
    throw error;
  }
}

function legacyHeaderToJson(
  rows: Awaited<ReturnType<typeof fetchLegacyMenuItems>>,
): MenuJsonItem[] {
  const top = rows
    .filter((row) => row.enabled && !row.parentId)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return top.map((item, index) => {
    const children = rows
      .filter((row) => row.parentId === item.id && row.enabled)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((child, childIndex) => ({
        label: child.label,
        href: child.href,
        order: childIndex,
      }));

    return {
      label: item.label,
      href: item.href,
      order: index,
      children: children.length > 0 ? children : undefined,
    };
  });
}

function legacyFooterColumnToJson(
  rows: Awaited<ReturnType<typeof fetchLegacyMenuItems>>,
  column: string,
): MenuJsonItem[] {
  return rows
    .filter(
      (row) =>
        row.enabled &&
        !row.parentId &&
        row.footerColumn === column,
    )
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((item, index) => ({
      label: item.label,
      href: item.href,
      order: index,
    }));
}

async function resolveMenuItems(location: MenuLocation): Promise<MenuJsonItem[]> {
  const json = await fetchJsonMenu(location);
  if (json !== null) return json;

  if (location === "header") {
    const legacy = await fetchLegacyMenuItems("header");
    if (legacy.length > 0) return legacyHeaderToJson(legacy);
    return defaultHeaderItems();
  }

  if (location === "footer-services") {
    const legacy = await fetchLegacyMenuItems("footer");
    const fromLegacy = legacyFooterColumnToJson(legacy, "services");
    if (fromLegacy.length > 0) return fromLegacy;
    return defaultFooterServices();
  }

  if (location === "footer-growth") {
    const legacy = await fetchLegacyMenuItems("footer");
    const fromLegacy = legacyFooterColumnToJson(legacy, "growth");
    if (fromLegacy.length > 0) return fromLegacy;
    return defaultFooterGrowth();
  }

  const legacy = await fetchLegacyMenuItems("footer");
  const fromLegacy = legacyFooterColumnToJson(legacy, "company");
  if (fromLegacy.length > 0) return fromLegacy;
  return defaultFooterCompany();
}

function jsonToNavItems(items: MenuJsonItem[]): NavItem[] {
  // Only render dropdowns when the admin menu explicitly has children.
  // Do not auto-inject static service lists.
  return sortByOrder(items).map((item, index) => {
    const children = sortByOrder(item.children ?? []);

    if (children.length > 0) {
      return {
        id: `menu-header-${index}`,
        label: item.label,
        href: item.href,
        children: children.map((child) => ({
          label: child.label,
          href: child.href,
        })),
        viewAllLabel:
          item.href === servicesIndexPath
            ? "View all services"
            : item.href === servicePath({ slug: "digital-marketing" })
              ? "View all digital marketing"
              : undefined,
      };
    }

    return {
      id: `menu-header-${index}`,
      label: item.label,
      href: item.href,
    };
  });
}

async function loadHeaderNav(): Promise<NavItem[]> {
  try {
    const items = await resolveMenuItems("header");
    if (items.length === 0) {
      return primaryNavItems.map((item, index) => ({
        ...item,
        id: `static-header-${index}`,
      }));
    }
    return jsonToNavItems(items);
  } catch (error) {
    if (isMissingRelationError(error)) {
      console.warn(
        "[menus] menus table missing; using static header nav. Run npm run db:migrate.",
      );
    } else {
      console.warn("[menus] header fetch failed; using static header nav.", error);
    }
    return primaryNavItems.map((item, index) => ({
      ...item,
      id: `static-header-${index}`,
    }));
  }
}

async function loadFooterMenus() {
  try {
    const [services, growth, company] = await Promise.all([
      resolveMenuItems("footer-services"),
      resolveMenuItems("footer-growth"),
      resolveMenuItems("footer-company"),
    ]);

    return {
      services: sortByOrder(services).map((item, index) => ({
        id: `footer-services-${index}`,
        label: item.label,
        href: item.href,
      })),
      growth: sortByOrder(growth).map((item, index) => ({
        id: `footer-growth-${index}`,
        label: item.label,
        href: item.href,
      })),
      company: sortByOrder(company).map((item, index) => ({
        id: `footer-company-${index}`,
        label: item.label,
        href: item.href,
      })),
    };
  } catch (error) {
    if (isMissingRelationError(error)) {
      console.warn(
        "[menus] menus table missing; using static footer nav. Run npm run db:migrate.",
      );
    } else {
      console.warn("[menus] footer fetch failed; using static footer nav.", error);
    }
    return staticFooterMenus();
  }
}

export function getHeaderNavItems() {
  return unstable_cache(loadHeaderNav, ["menu-header-v5"], {
    tags: ["menus"],
  })();
}

export function getFooterMenuItems() {
  return unstable_cache(loadFooterMenus, ["menu-footer-v5"], {
    tags: ["menus"],
  })();
}

/** Raw menu items for a single location (admin + public helpers). */
export function getMenuByLocation(location: MenuLocation) {
  return unstable_cache(
    () => resolveMenuItems(location),
    ["menu-location", location],
    { tags: ["menus"] },
  )();
}

export async function getAdminMenusByLocation(
  location: MenuLocation,
): Promise<AdminMenuItem[]> {
  const items = await resolveMenuItems(location);
  return toClientItems(items);
}

export async function getAdminMenuLinkOptions(): Promise<MenuLinkOption[]> {
  const [pageRows, serviceRows, postRows, jobRows] = await Promise.all([
    getDb()
      .select({ title: pages.title, slug: pages.slug, path: pages.path })
      .from(pages)
      .where(eq(pages.status, "published"))
      .orderBy(asc(pages.title)),
    getDb()
      .select({
        id: services.id,
        name: services.name,
        slug: services.slug,
        parentId: services.parentId,
      })
      .from(services)
      .where(eq(services.status, "published"))
      .orderBy(asc(services.name)),
    getDb()
      .select({ title: posts.title, slug: posts.slug })
      .from(posts)
      .where(eq(posts.status, "published"))
      .orderBy(asc(posts.title)),
    getDb()
      .select({ title: jobs.title, slug: jobs.slug })
      .from(jobs)
      .where(eq(jobs.status, "published"))
      .orderBy(asc(jobs.title)),
  ]);

  const servicePaths = servicePathsById(serviceRows);

  const siteLinks: MenuLinkOption[] = [
    { label: "Home", href: "/", group: "Site" },
    { label: "Services index", href: servicesIndexPath, group: "Site" },
    { label: "Work", href: workIndexPath, group: "Site" },
    { label: "Blog", href: blogIndexPath, group: "Site" },
    { label: "About", href: "/about-us", group: "Site" },
    { label: "Contact", href: "/contact-us", group: "Site" },
    { label: "Careers index", href: "/careers", group: "Site" },
  ];

  return [
    ...siteLinks,
    ...pageRows.map((row) => ({
      label: row.title,
      href: pagePath(row.path || row.slug),
      group: "Pages" as const,
    })),
    ...serviceRows.map((row) => ({
      label: row.name,
      href: servicePaths.get(row.id) ?? servicePath({ slug: row.slug }),
      group: "Services" as const,
    })),
    ...postRows.map((row) => ({
      label: row.title,
      href: postPath(row.slug),
      group: "Posts" as const,
    })),
    ...jobRows.map((row) => ({
      label: row.title,
      href: jobPath(row.slug),
      group: "Careers" as const,
    })),
  ];
}
