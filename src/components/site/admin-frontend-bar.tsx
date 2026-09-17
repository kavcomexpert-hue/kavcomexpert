"use client";

import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const STAFF_ROLES = new Set(["admin", "editor", "author"]);

function isStagingEnv() {
  return (
    process.env.NEXT_PUBLIC_ENV === "staging" ||
    process.env.NEXT_PUBLIC_DEPLOY_ENV === "staging"
  );
}

/**
 * Staff-only overlay. Mount only when a session cookie exists
 * (see site layout) so anonymous visitors never call /api/auth/get-session.
 * Session is cached in Better Auth's shared client atom for the SPA lifetime.
 */
export function AdminFrontendBar() {
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();
  // Keyed by path so a stale href never renders for a different page.
  const [editTarget, setEditTarget] = useState<{
    path: string;
    href: string | null;
  } | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const role = (session?.user as { role?: string | null } | undefined)?.role;
  const visible =
    !isPending && Boolean(session?.user) && STAFF_ROLES.has(role ?? "");
  const editHref = editTarget?.path === pathname ? editTarget.href : null;

  useEffect(() => {
    if (!visible) {
      document.documentElement.style.removeProperty("--admin-bar-offset");
      return;
    }

    document.documentElement.style.setProperty("--admin-bar-offset", "36px");
    return () => {
      document.documentElement.style.removeProperty("--admin-bar-offset");
    };
  }, [visible]);

  useEffect(() => {
    if (!visible || !pathname) {
      return;
    }

    let cancelled = false;
    const path = pathname;

    async function loadEditTarget() {
      try {
        const res = await fetch(
          `/api/admin/edit-target?path=${encodeURIComponent(path)}`,
          { credentials: "same-origin" },
        );
        if (!res.ok) {
          if (!cancelled) setEditTarget({ path, href: null });
          return;
        }
        const data = (await res.json()) as { href?: string | null };
        if (!cancelled) setEditTarget({ path, href: data.href ?? null });
      } catch {
        if (!cancelled) setEditTarget({ path, href: null });
      }
    }

    void loadEditTarget();
    return () => {
      cancelled = true;
    };
  }, [visible, pathname]);

  if (!visible) {
    return null;
  }

  const name =
    session?.user?.name?.trim() || session?.user?.email?.trim() || "Staff";
  const staging = isStagingEnv();

  async function signOut() {
    setSigningOut(true);
    try {
      const { clearClientMarkerCookie, STAFF_MARKER_COOKIE } = await import(
        "@/lib/auth/marker-cookies"
      );
      clearClientMarkerCookie(STAFF_MARKER_COOKIE);
      await authClient.signOut();
      window.location.href = "/";
    } catch {
      setSigningOut(false);
    }
  }

  return (
    <div className="fixed inset-x-0 top-0 z-[70] h-9 border-b border-border bg-foreground text-background">
      <div className="mx-auto flex h-full max-w-[1120px] items-center justify-between gap-3 px-4 text-xs font-medium sm:px-6">
        <div className="flex min-w-0 items-center gap-2 truncate">
          {staging ? (
            <span className="shrink-0 rounded-default bg-accent px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-surface">
              Staging
            </span>
          ) : null}
          <span className="truncate">Logged in as {name}</span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/admin"
            className="transition-opacity hover:opacity-80"
          >
            Dashboard
          </Link>
          {editHref ? (
            <Link
              href={editHref}
              className="transition-opacity hover:opacity-80"
            >
              Edit this page
            </Link>
          ) : null}
          <button
            type="button"
            disabled={signingOut}
            onClick={() => void signOut()}
            className="transition-opacity hover:opacity-80 disabled:opacity-60"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>
    </div>
  );
}
