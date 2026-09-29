import {
  getCachedRedirects,
  recordRedirectHit,
  shouldLookupRedirect,
} from "@/lib/redirects/middleware-cache";
import { getCachedMaintenanceMode } from "@/lib/maintenance/cache";
import { rateLimiter, RATE_LIMITS } from "@/lib/rate-limit";
import { auth } from "@/lib/auth";
import { hasSessionCookieOnRequest } from "@/lib/auth/has-session-cookie";
import {
  DRAFT_MARKER_COOKIE,
  draftMarkerCookieOptions,
  STAFF_MARKER_COOKIE,
  staffMarkerCookieOptions,
} from "@/lib/auth/marker-cookies";
import { isTrustedActionHost } from "@/lib/security/trusted-origins";
import { publicUrl, SITE_URL } from "@/lib/seo/constants";
import { NextRequest, NextResponse } from "next/server";

/** Routes that require role=admin (cookie presence alone is not enough). */
const ADMIN_ONLY_PREFIXES = [
  "/admin/users",
  "/admin/settings",
  "/admin/redirects",
  "/admin/audit-log",
] as const;

/** Routes that require admin or editor (authors are redirected). */
const EDITOR_PLUS_PREFIXES = [
  "/admin/pages",
  "/admin/services",
  "/admin/testimonials",
  "/admin/taxonomy",
  "/admin/menus",
  "/admin/leads",
  "/admin/seo",
  "/admin/jobs",
  "/admin/applications",
] as const;

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function isAdminOnlyPath(pathname: string): boolean {
  return ADMIN_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isEditorPlusPath(pathname: string): boolean {
  return EDITOR_PLUS_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isMaintenanceExempt(pathname: string): boolean {
  if (pathname.startsWith("/admin")) return true;
  if (pathname.startsWith("/api/auth")) return true;
  if (pathname.startsWith("/api/admin")) return true;
  // Cron and preview must keep working while maintenance mode is on,
  // otherwise scheduled publishing silently stops.
  if (pathname.startsWith("/api/cron")) return true;
  if (pathname.startsWith("/api/preview")) return true;
  if (pathname === "/maintenance") return true;
  return false;
}

/** Next.js Draft Mode uses these httpOnly cookies — readable in middleware. */
function hasDraftModeCookie(request: NextRequest): boolean {
  return (
    Boolean(request.cookies.get("__prerender_bypass")?.value) ||
    Boolean(request.cookies.get("__next_preview_data")?.value)
  );
}

/**
 * Sync non-httpOnly marker cookies so client gates work without
 * cookies()/draftMode() in the public layout (ISR-friendly).
 */
function withMarkerCookies(
  request: NextRequest,
  response: NextResponse,
): NextResponse {
  const hasSession = hasSessionCookieOnRequest(request);
  const staffMarker = request.cookies.get(STAFF_MARKER_COOKIE)?.value;
  if (hasSession && staffMarker !== "1") {
    response.cookies.set(
      STAFF_MARKER_COOKIE,
      "1",
      staffMarkerCookieOptions(),
    );
  } else if (!hasSession && staffMarker) {
    response.cookies.set(STAFF_MARKER_COOKIE, "", {
      ...staffMarkerCookieOptions(0),
      maxAge: 0,
    });
  }

  const draftOn = hasDraftModeCookie(request);
  const draftMarker = request.cookies.get(DRAFT_MARKER_COOKIE)?.value;
  if (draftOn && draftMarker !== "1") {
    response.cookies.set(
      DRAFT_MARKER_COOKIE,
      "1",
      draftMarkerCookieOptions(),
    );
  } else if (!draftOn && draftMarker) {
    response.cookies.set(DRAFT_MARKER_COOKIE, "", {
      ...draftMarkerCookieOptions(0),
      maxAge: 0,
    });
  }

  return response;
}

/** Redirect using NEXT_PUBLIC_SITE_URL — never request.url (0.0.0.0 bind). */
function redirectTo(
  request: NextRequest,
  path: string,
  status?: number,
): NextResponse {
  const response =
    path.startsWith("http://") || path.startsWith("https://")
      ? NextResponse.redirect(path, status)
      : NextResponse.redirect(publicUrl(path), status);
  return withMarkerCookies(request, response);
}

function withTrustedForwardedHost(request: NextRequest): Headers {
  const headers = new Headers(request.headers);
  const originHeader = request.headers.get("origin");
  if (!originHeader || originHeader === "null") return headers;
  try {
    const originHost = new URL(originHeader).host;
    if (isTrustedActionHost(originHost)) {
      // Hostinger binds Node to 0.0.0.0. If the proxy Host / X-Forwarded-Host
      // is the bind address, Next.js Server Action CSRF aborts the POST.
      headers.set("x-forwarded-host", originHost);
    }
  } catch {
    // Ignore malformed Origin.
  }
  return headers;
}

function next(request: NextRequest): NextResponse {
  return withMarkerCookies(
    request,
    NextResponse.next({
      request: { headers: withTrustedForwardedHost(request) },
    }),
  );
}

function rewriteMaintenance(request: NextRequest): NextResponse {
  return withMarkerCookies(
    request,
    NextResponse.rewrite(new URL("/maintenance", `${SITE_URL}/`)),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Large multipart uploads must not be buffered/redirected by middleware.
  // Auth + validation happen in the route handler.
  if (pathname === "/api/admin/upload") {
    return next(request);
  }

  // Server Actions: never rewrite/redirect these POSTs. Middleware rewrites
  // (e.g. maintenance → /maintenance) cause Next.js to "forward" the action
  // to another worker, which loops and surfaces as:
  //   failed to forward action response TypeError: fetch failed
  const isServerAction =
    request.method === "POST" &&
    (request.headers.has("next-action") ||
      request.headers.has("Next-Action"));
  if (isServerAction) {
    // Still enforce admin auth for /admin actions without rewriting the path.
    if (
      pathname.startsWith("/admin") &&
      pathname !== "/admin/login" &&
      !pathname.startsWith("/admin/invite/")
    ) {
      if (!hasSessionCookieOnRequest(request)) {
        return next(request);
      }
      try {
        const session = await auth.api.getSession({
          headers: request.headers,
          method: "GET",
        });
        if (!session) {
          // Never redirect Server Action POSTs — Next.js then parses HTML
          // and the client throws "An unexpected response was received".
          return next(request);
        }
        const suspended = Boolean(
          (session.user as { suspended?: boolean | null }).suspended,
        );
        if (suspended) {
          return next(request);
        }
        if (isAdminOnlyPath(pathname)) {
          const role =
            (session.user as { role?: string | null }).role ?? "author";
          if (role !== "admin") {
            return next(request);
          }
        } else if (isEditorPlusPath(pathname)) {
          const role =
            (session.user as { role?: string | null }).role ?? "author";
          if (role !== "admin" && role !== "editor") {
            return next(request);
          }
        }
      } catch {
        // Neon/auth wake blips must not break Server Actions with rewrite loops.
        // Route handlers / actions still enforce auth.
        return next(request);
      }
    }
    return next(request);
  }

  // Login rate limit (generic error body; does not reveal account existence)
  if (
    request.method === "POST" &&
    (pathname === "/api/auth/sign-in/email" ||
      pathname.startsWith("/api/auth/sign-in/email"))
  ) {
    const limited = rateLimiter.limit(
      `login:${clientIp(request)}`,
      RATE_LIMITS.login.max,
      RATE_LIMITS.login.windowMs,
    );
    if (!limited.success) {
      return withMarkerCookies(
        request,
        NextResponse.json(
          { message: "Invalid email or password" },
          { status: 429 },
        ),
      );
    }
  }

  if (pathname === "/case-studies") {
    return redirectTo(request, "/work", 301);
  }

  if (pathname.startsWith("/case-studies/")) {
    const slug = pathname.slice("/case-studies/".length);
    return redirectTo(request, `/work/${slug}`, 301);
  }

  // Both lookups are independently cached; start them together so a cold
  // cache window costs one DB round trip of latency instead of two.
  const redirectLookup = shouldLookupRedirect(pathname)
    ? getCachedRedirects().catch(() => null)
    : null;
  const maintenanceLookup = !isMaintenanceExempt(pathname)
    ? getCachedMaintenanceMode().catch(() => false)
    : null;

  // (a) Redirects table lookup first (cached + async hits)
  if (redirectLookup) {
    const redirectRules = await redirectLookup;
    const match = redirectRules?.find((rule) => rule.fromPath === pathname);

    if (match) {
      void recordRedirectHit(match.fromPath);
      const dest =
        match.toPath.startsWith("http://") ||
        match.toPath.startsWith("https://")
          ? match.toPath
          : publicUrl(match.toPath).toString();
      return withMarkerCookies(
        request,
        NextResponse.redirect(dest, {
          status: match.permanent ? 301 : 302,
        }),
      );
    }
  }

  // Maintenance mode: public visitors get 503 branded page; admin/editor bypass
  if (maintenanceLookup) {
    try {
      const maintenanceOn = await maintenanceLookup;
      if (maintenanceOn) {
        // Anonymous / bots: no session cookie → maintenance rewrite, zero auth work.
        if (!hasSessionCookieOnRequest(request)) {
          return rewriteMaintenance(request);
        }

        const session = await auth.api.getSession({
          headers: request.headers,
          method: "GET",
        });
        const role =
          (session?.user as { role?: string | null } | undefined)?.role ?? null;
        const suspended = Boolean(
          (session?.user as { suspended?: boolean | null } | undefined)
            ?.suspended,
        );
        // Authors need public-page access while Draft Mode preview is active.
        const canBypass =
          Boolean(session) &&
          !suspended &&
          (role === "admin" || role === "editor" || role === "author");

        if (!canBypass) {
          return rewriteMaintenance(request);
        }
      }
    } catch {
      // Fail open if maintenance lookup fails
    }
  }

  // (b)+(c) Admin auth + role gates
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login" || pathname.startsWith("/admin/invite/")) {
      return next(request);
    }

    if (!hasSessionCookieOnRequest(request)) {
      return redirectTo(request, "/admin/login");
    }

    let session: Awaited<ReturnType<typeof auth.api.getSession>>;
    try {
      session = await auth.api.getSession({
        headers: request.headers,
        method: "GET",
      });
    } catch {
      return next(request);
    }

    if (!session) {
      return redirectTo(request, "/admin/login");
    }

    const suspended = Boolean(
      (session.user as { suspended?: boolean | null }).suspended,
    );
    if (suspended) {
      return redirectTo(request, "/admin/login");
    }

    if (isAdminOnlyPath(pathname)) {
      const role =
        (session.user as { role?: string | null }).role ?? "author";
      if (role !== "admin") {
        return redirectTo(request, "/admin");
      }
    } else if (isEditorPlusPath(pathname)) {
      const role =
        (session.user as { role?: string | null }).role ?? "author";
      if (role !== "admin" && role !== "editor") {
        return redirectTo(request, "/admin");
      }
    }
  }

  return next(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/admin/upload|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|woff|woff2|ttf|map|txt|xml|json|webmanifest)$).*)",
  ],
};
