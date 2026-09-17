import { AdminFrontendBarGate } from "@/components/site/admin-frontend-bar-gate";
import { CookieConsentLoader } from "@/components/site/cookie-consent-loader";
import { LenisProvider } from "@/components/site/lenis-provider";
import { getSiteSettings } from "@/lib/queries/site-settings";
import { Inter, Space_Mono } from "next/font/google";

const fontSans = Inter({
  variable: "--font-landing-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const fontMono = Space_Mono({
  variable: "--font-landing-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

/**
 * Landing pages: no site header/footer, no chatbot/popups.
 * Theme, consent, and analytics still apply.
 */
export default async function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();

  return (
    <LenisProvider>
      <AdminFrontendBarGate />
      <div
        className={`${fontSans.variable} ${fontMono.variable} flex min-h-screen flex-col bg-background pt-[var(--admin-bar-offset,0px)] [--font-landing-body:var(--font-landing-sans)]`}
        style={
          {
            "--font-sans": "var(--font-landing-sans)",
            "--font-mono": "var(--font-landing-mono)",
          } as React.CSSProperties
        }
      >
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        {children}
      </div>
      <CookieConsentLoader
        ga4Id={settings.ga4Id || process.env.NEXT_PUBLIC_GA_ID || "G-CDCFPPB648"}
        clarityId={
          settings.clarityId ||
          process.env.NEXT_PUBLIC_CLARITY_ID ||
          "xtct6gf65h"
        }
        consent={settings.consent}
      />
    </LenisProvider>
  );
}
