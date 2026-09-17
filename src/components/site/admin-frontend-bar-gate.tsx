"use client";

import { AdminFrontendBar } from "@/components/site/admin-frontend-bar";
import {
  hasClientMarkerCookie,
  STAFF_MARKER_COOKIE,
} from "@/lib/auth/marker-cookies";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Mounts the staff admin bar only when the non-httpOnly staff marker is set.
 * Avoids /api/auth/get-session for anonymous visitors without cookies() in layout.
 */
export function AdminFrontendBarGate() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(hasClientMarkerCookie(STAFF_MARKER_COOKIE));
  }, [pathname]);

  if (!enabled) return null;
  return <AdminFrontendBar />;
}
