"use client";

import dynamic from "next/dynamic";
import type { ConsentConfig } from "@/lib/consent/defaults";
import { useIdleReady } from "@/hooks/use-idle-ready";

const CookieConsent = dynamic(
  () =>
    import("@/components/site/cookie-consent").then(
      (module) => module.CookieConsent,
    ),
  { ssr: false },
);

type CookieConsentLoaderProps = {
  ga4Id?: string | null;
  clarityId?: string | null;
  consent: ConsentConfig;
};

/** Consent banner + analytics scripts mount after idle (fixed UI, not LCP). Analytics always load. */
export function CookieConsentLoader(props: CookieConsentLoaderProps) {
  const ready = useIdleReady({ timeoutMs: 2500 });
  if (!ready) return null;
  return <CookieConsent {...props} />;
}
