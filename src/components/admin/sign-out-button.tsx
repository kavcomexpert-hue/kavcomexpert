"use client";

import { authClient } from "@/lib/auth-client";
import {
  clearClientMarkerCookie,
  STAFF_MARKER_COOKIE,
} from "@/lib/auth/marker-cookies";
import { useRouter } from "next/navigation";
import { useState } from "react";

type SignOutButtonProps = {
  className?: string;
};

export function SignOutButton({ className }: SignOutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    clearClientMarkerCookie(STAFF_MARKER_COOKIE);
    await authClient.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className={`inline-flex items-center justify-center rounded-default border border-border bg-transparent font-medium text-foreground transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
        className ??
        "h-11 px-5 text-sm hover:bg-surface focus-visible:ring-offset-background"
      }`}
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
