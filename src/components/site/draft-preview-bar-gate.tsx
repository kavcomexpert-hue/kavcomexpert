"use client";

import { DraftPreviewBar } from "@/components/site/draft-preview-bar";
import {
  DRAFT_MARKER_COOKIE,
  hasClientMarkerCookie,
} from "@/lib/auth/marker-cookies";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** Shows draft chrome only when the draft marker cookie is present. */
export function DraftPreviewBarGate() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(hasClientMarkerCookie(DRAFT_MARKER_COOKIE));
  }, [pathname]);

  if (!enabled) return null;
  return <DraftPreviewBar />;
}
