import { AdminFrontendBarGate } from "@/components/site/admin-frontend-bar-gate";
import { AnnouncementBar } from "@/components/site/announcement-bar";
import { ChatbotLoader } from "@/components/site/chatbot/chatbot-loader";
import { CookieConsentLoader } from "@/components/site/cookie-consent-loader";
import { DraftPreviewBarGate } from "@/components/site/draft-preview-bar-gate";
import { JsonLd } from "@/components/seo/json-ld";
import { LenisProvider } from "@/components/site/lenis-provider";
import { PopupControllerLoader } from "@/components/site/popups/popup-controller-loader";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import {
  buildOrganizationSchema,
  buildWebSiteSchema,
} from "@/lib/schema/organization";
import { getLinkButton } from "@/lib/queries/content-blocks";
import { linkButton } from "@/lib/content/link-button";
import { getHeaderNavItems } from "@/lib/queries/menus";
import { getActivePopups } from "@/lib/queries/popups";
import { getSiteSettings } from "@/lib/queries/site-settings";
import { getTurnstileSiteKey } from "@/lib/security/turnstile-config";

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // No cookies()/draftMode() here — keeps anonymous HTML on the ISR/static path.
  // Staff/draft chrome is gated client-side via non-httpOnly marker cookies.
  const turnstileSiteKey = getTurnstileSiteKey();
  const [settings, navItems, activePopups, headerCta] = await Promise.all([
    getSiteSettings(),
    getHeaderNavItems(),
    getActivePopups().catch(() => []),
    getLinkButton("global.header.cta").catch(() =>
      linkButton("Book a call", "/contact-us"),
    ),
  ]);

  return (
    <LenisProvider>
      <JsonLd
        data={[
          buildOrganizationSchema(settings),
          buildWebSiteSchema(settings),
        ]}
      />
      <AdminFrontendBarGate />
      <div className="flex min-h-screen flex-col bg-background pt-[var(--admin-bar-offset,0px)]">
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <DraftPreviewBarGate />
        {settings.announcementEnabled && settings.announcementText ? (
          <AnnouncementBar text={settings.announcementText} />
        ) : null}
        <SiteHeader
          organizationName={settings.organizationName}
          navItems={navItems}
          cta={headerCta}
          logoSrc={settings.logoUrl || undefined}
        />
        <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
        <SiteFooter logoSrc={settings.logoUrl || undefined} />
      </div>
      <ChatbotLoader turnstileSiteKey={turnstileSiteKey} />
      <PopupControllerLoader
        popups={activePopups}
        turnstileSiteKey={turnstileSiteKey}
      />
      <CookieConsentLoader
        ga4Id={settings.ga4Id}
        clarityId={settings.clarityId}
        consent={settings.consent}
      />
    </LenisProvider>
  );
}
