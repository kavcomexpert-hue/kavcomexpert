import { auth } from "@/lib/auth";
import { parseAppRole } from "@/lib/authz";
import { getDb } from "@/lib/db";
import { caseStudies, pages, posts, services } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STAFF_ROLES = new Set(["admin", "editor", "author"]);

function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

function normalizePath(raw: string): string {
  if (!raw || raw === "/") return "/";
  const withSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withSlash.replace(/\/+$/, "") || "/";
}

async function resolveEditHref(path: string): Promise<string | null> {
  const db = getDb();
  const normalized = normalizePath(path);

  if (normalized.startsWith("/blog/")) {
    const slug = normalized.slice("/blog/".length).split("/")[0];
    if (!slug) return null;
    const [row] = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.slug, slug))
      .limit(1);
    return row ? `/admin/posts/${row.id}` : null;
  }

  if (normalized.startsWith("/work/")) {
    const slug = normalized.slice("/work/".length).split("/")[0];
    if (!slug) return null;
    const [row] = await db
      .select({ id: caseStudies.id })
      .from(caseStudies)
      .where(eq(caseStudies.slug, slug))
      .limit(1);
    return row ? `/admin/case-studies/${row.id}` : null;
  }

  if (normalized.startsWith("/services/")) {
    const parts = normalized
      .slice("/services/".length)
      .split("/")
      .filter(Boolean);
    if (parts.length === 0) return null;

    if (parts.length === 1) {
      const [row] = await db
        .select({ id: services.id })
        .from(services)
        .where(and(eq(services.slug, parts[0]!), isNull(services.parentId)))
        .limit(1);
      if (row) return `/admin/services/${row.id}`;

      const [any] = await db
        .select({ id: services.id })
        .from(services)
        .where(eq(services.slug, parts[0]!))
        .limit(1);
      return any ? `/admin/services/${any.id}` : null;
    }

    const [parent] = await db
      .select({ id: services.id })
      .from(services)
      .where(eq(services.slug, parts[0]!))
      .limit(1);
    if (!parent) return null;

    const [child] = await db
      .select({ id: services.id })
      .from(services)
      .where(
        and(eq(services.slug, parts[1]!), eq(services.parentId, parent.id)),
      )
      .limit(1);
    return child ? `/admin/services/${child.id}` : `/admin/services/${parent.id}`;
  }

  const [byPath] = await db
    .select({ id: pages.id })
    .from(pages)
    .where(eq(pages.path, normalized))
    .limit(1);
  if (byPath) return `/admin/pages/${byPath.id}`;

  const slugGuess =
    normalized === "/"
      ? "home"
      : (normalized.replace(/^\//, "").split("/")[0] ?? "");
  if (!slugGuess) return null;

  const [bySlug] = await db
    .select({ id: pages.id })
    .from(pages)
    .where(eq(pages.slug, slugGuess))
    .limit(1);
  return bySlug ? `/admin/pages/${bySlug.id}` : null;
}

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return unauthorized();
  }

  const role = parseAppRole(
    (session.user as { role?: string | null }).role,
  );
  if (!STAFF_ROLES.has(role)) {
    return unauthorized();
  }

  const suspended = Boolean(
    (session.user as { suspended?: boolean | null }).suspended,
  );
  if (suspended) {
    return unauthorized();
  }

  const path = request.nextUrl.searchParams.get("path");
  if (!path) {
    return Response.json({ href: null });
  }

  try {
    const href = await resolveEditHref(path);
    return Response.json(
      { href },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.warn("[edit-target] resolve failed", error);
    return Response.json({ href: null });
  }
}
