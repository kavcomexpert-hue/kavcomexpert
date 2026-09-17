/**
 * A4 slug-system proof — run: npx tsx scripts/slug-proof.ts
 */
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { like } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { redirects, services } from "@/lib/db/schema";
import { servicePath, servicePathsById } from "@/lib/paths";
import { enrichServiceCardsBySlug } from "@/lib/site/enrich-service-cards";
import { buildBreadcrumbListSchema } from "@/lib/schema/breadcrumbs";
import { servicesIndexPath } from "@/lib/paths";

for (const file of [".env.local", ".env"]) {
  const path = resolve(process.cwd(), file);
  if (existsSync(path)) config({ path, quiet: true });
}

async function main() {
  const db = getDb();
  const allServices = await db
    .select({
      id: services.id,
      slug: services.slug,
      name: services.name,
      shortPitch: services.shortPitch,
      parentId: services.parentId,
      status: services.status,
    })
    .from(services);

  const paths = servicePathsById(allServices);
  const slugById = new Map(allServices.map((s) => [s.id, s.slug]));

  console.log("=== A4 SLUG PROOF ===\n");

  console.log("--- Nested child services (digital-marketing parent) ---");
  const dm = allServices.find((s) => s.slug === "digital-marketing");
  if (dm) {
    for (const c of allServices.filter((s) => s.parentId === dm.id).slice(0, 6)) {
      console.log(
        JSON.stringify({
          name: c.name,
          slug: c.slug,
          canonical: paths.get(c.id),
        }),
      );
    }
  }

  console.log("\n--- 301 redirect rows (/services/*) ---");
  const redirs = await db
    .select()
    .from(redirects)
    .where(like(redirects.fromPath, "/services/%"))
    .limit(20);
  for (const r of redirs) {
    console.log(JSON.stringify({ from: r.fromPath, to: r.toPath, permanent: r.permanent }));
  }

  console.log("\n--- Homepage growth cards after enrichServiceCardsBySlug ---");
  const growthDefaults = [
    { name: "Digital Marketing", href: "/services/digital-marketing", description: "" },
    { name: "Video Editing", href: "/services/video-editing", description: "" },
    { name: "Virtual Assistant", href: "/services/virtual-assistant", description: "" },
  ];
  const published = allServices.filter((s) => s.status === "published");
  for (const c of enrichServiceCardsBySlug(growthDefaults, published)) {
    console.log(JSON.stringify({ name: c.name, href: c.href }));
  }

  console.log("\n--- Breadcrumb JSON-LD (virtual-assistant) ---");
  const va = allServices.find((s) => s.slug === "virtual-assistant");
  if (va) {
    const parentSlug = va.parentId ? slugById.get(va.parentId) : null;
    const canonical = servicePath({ slug: va.slug, parentSlug });
    const crumbs = [
      { label: "Home", href: "/" },
      { label: "Services", href: servicesIndexPath },
      ...(parentSlug
        ? [{ label: "Digital Marketing", href: servicePath({ slug: parentSlug }) }]
        : []),
      { label: va.name, href: canonical },
    ];
    console.log(JSON.stringify(buildBreadcrumbListSchema(crumbs), null, 2));
  }

  console.log("\n--- Sitemap paths (nested marketing services, from path builder) ---");
  if (dm) {
    for (const c of allServices
      .filter((s) => s.parentId === dm.id && s.status === "published")
      .slice(0, 8)) {
      console.log(JSON.stringify({ path: paths.get(c.id), slug: c.slug }));
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
