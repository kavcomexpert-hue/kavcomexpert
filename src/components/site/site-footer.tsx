import { SocialIconLinks } from "@/components/site/social-icons";
import { CookiePreferencesLink } from "@/components/site/cookie-preferences-link";
import {
  getContent,
  getContentMap,
  getLinkButton,
} from "@/lib/queries/content-blocks";
import { SiteLinkButton } from "@/components/site/site-link-button";
import { getFooterMenuItems } from "@/lib/queries/menus";
import { getFooterLegalPages } from "@/lib/queries/pages";
import { getSiteSettings } from "@/lib/queries/site-settings";
import { siteTagline } from "@/lib/site/nav";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export async function SiteFooter({
  logoSrc = "/logo.png",
}: {
  logoSrc?: string;
} = {}) {
  const [settings, legalPages, footerMenus, connectCta, footerTagline, labels] =
    await Promise.all([
      getSiteSettings(),
      getFooterLegalPages().catch(() => []),
      getFooterMenuItems().catch(() => ({
        services: [],
        growth: [],
        company: [],
      })),
      getLinkButton("global.footer.connect_cta"),
      getContent("global.footer.tagline"),
      getContentMap([
        "global.footer.col_services",
        "global.footer.col_growth",
        "global.footer.col_company",
        "global.footer.col_connect",
        "global.footer.privacy_label",
        "global.footer.terms_label",
      ]),
    ]);

  const privacy =
    legalPages.find((page) => page.slug === "privacy-policy") ?? null;
  const terms =
    legalPages.find((page) => page.slug === "terms-of-service") ?? null;

  const tagline =
    settings.tagline?.trim() || footerTagline || siteTagline;

  const columns = [
    {
      title: labels["global.footer.col_services"] || "Services",
      items: footerMenus.services,
    },
    {
      title: labels["global.footer.col_growth"] || "Growth & Support",
      items: footerMenus.growth,
    },
    {
      title: labels["global.footer.col_company"] || "Company",
      items: footerMenus.company,
    },
  ] as const;

  return (
    <footer className="relative overflow-hidden border-t border-border bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,color-mix(in_oklab,var(--accent)_18%,transparent),transparent_55%),radial-gradient(ellipse_at_90%_100%,color-mix(in_oklab,var(--accent-lime)_12%,transparent),transparent_50%)]"
      />

      <div className="relative mx-auto max-w-[1120px] px-6 pb-10 pt-16 md:pb-12 md:pt-20">
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="min-w-0">
            <Link href="/" className="group inline-flex flex-col gap-3">
              <span className="inline-flex items-center gap-3">
                <Image
                  src={logoSrc}
                  alt=""
                  width={44}
                  height={44}
                  loading="lazy"
                  className="size-11 shrink-0 object-contain transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                />
                <span className="text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-accent">
                  {settings.organizationName}
                </span>
              </span>
              <span className="text-sm font-semibold leading-relaxed text-foreground">
                {tagline}
              </span>
            </Link>
          </div>

          {columns.map((column) => (
            <div key={column.title} className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-foreground">
                {column.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {column.items.map((item) => (
                  <li key={item.id ?? `${item.href}-${item.label}`}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted transition-colors hover:text-accent"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-foreground">
              {labels["global.footer.col_connect"] || "Connect"}
            </p>
            <div className="mt-4">
              <SocialIconLinks
                socialLinks={settings.socialLinks}
                alwaysShow
                itemClassName="inline-flex size-11 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-[border-color,color,transform] duration-300 hover:-translate-y-0.5 hover:border-accent hover:text-accent"
              />
            </div>
            <SiteLinkButton
              button={connectCta}
              className="group mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-surface transition-[opacity,transform] duration-300 hover:opacity-90"
            >
              <>
                {connectCta.label}
                <span
                  aria-hidden="true"
                  className="transition-transform duration-300 group-hover:translate-x-0.5"
                >
                  <ChevronRight
                    className="size-4"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </span>
              </>
            </SiteLinkButton>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} {settings.organizationName}. All rights
            reserved.
          </p>
          <nav aria-label="Legal" className="flex flex-wrap gap-4">
            <Link
              href={privacy ? privacy.path || `/${privacy.slug}` : "/privacy-policy"}
              className="text-xs text-muted transition-colors hover:text-foreground"
            >
              {labels["global.footer.privacy_label"] || "Privacy"}
            </Link>
            <Link
              href={terms ? terms.path || `/${terms.slug}` : "/terms-of-service"}
              className="text-xs text-muted transition-colors hover:text-foreground"
            >
              {labels["global.footer.terms_label"] || "Terms"}
            </Link>
            <CookiePreferencesLink className="text-xs text-muted transition-colors hover:text-foreground" />
          </nav>
        </div>
      </div>
    </footer>
  );
}
