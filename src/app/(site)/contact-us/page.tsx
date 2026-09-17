import { ContactForm } from "@/components/site/contact-form";
import { ContactSocialLinks } from "@/components/site/contact-social-links";
import { FaqSection } from "@/components/site/home/faq-section";
import { Ambient } from "@/components/site/home/motion/ambient";
import { InnerPageShell } from "@/components/site/inner-page-shell";
import {
  getContactPageSections,
  systemPageMetadata,
} from "@/lib/pages/system-page-content";
import { getSiteSettings } from "@/lib/queries/site-settings";
import { getTurnstileSiteKey } from "@/lib/security/turnstile-config";
import { buildStaticMetaFromKey } from "@/lib/seo/metadata";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return systemPageMetadata("contact-us", "/contact-us", () =>
    buildStaticMetaFromKey("contact"),
  );
}

export default async function ContactPage() {
  const [sections, settings] = await Promise.all([
    getContactPageSections(),
    getSiteSettings(),
  ]);
  const turnstileSiteKey = getTurnstileSiteKey();

  const faqItems = sections.faqs.filter(
    (item) => item.question.trim() && item.answer.trim(),
  );
  const sidebarEmail =
    settings.contactEmail?.trim() || sections.sidebarEmail;

  return (
    <InnerPageShell
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Contact" },
      ]}
    >
      <section className="relative overflow-clip pb-12 pt-4 md:pb-16 md:pt-6">
        <Ambient />
        <div className="relative mx-auto max-w-[1120px] px-6">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(260px,0.8fr)] lg:items-start lg:gap-10">
            <div id="contact-form" className="scroll-mt-28 space-y-5">
              <div className="max-w-xl">
                <p className="text-sm font-medium text-accent">
                  {sections.hero.eyebrow}
                </p>
                <h1 className="mt-2 text-balance text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-[1.08] tracking-[-0.035em] text-foreground">
                  {sections.hero.headline}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-muted md:text-base">
                  {sections.hero.subtext}
                </p>
              </div>

              <ContactForm
                formTitle={sections.formTitle}
                formSubtitle={sections.formSubtitle}
                formNameLabel={sections.formNameLabel}
                formEmailLabel={sections.formEmailLabel}
                formCompanyLabel={sections.formCompanyLabel}
                formPhoneLabel={sections.formPhoneLabel}
                formWebsiteLabel={sections.formWebsiteLabel}
                formServiceLabel={sections.formServiceLabel}
                formBudgetLabel={sections.formBudgetLabel}
                formMessageLabel={sections.formMessageLabel}
                formMessagePlaceholder={sections.formMessagePlaceholder}
                formSubmitLabel={sections.formSubmitLabel}
                formSuccessTitle={sections.formSuccessTitle}
                formSuccessBody={sections.formSuccessBody}
                formServiceOptions={sections.formServiceOptions}
                formBudgetOptions={sections.formBudgetOptions}
                turnstileSiteKey={turnstileSiteKey}
              />
            </div>

            <aside className="lg:sticky lg:top-28">
              <div className="rounded-default border border-border bg-surface p-5 md:p-6">
                <p className="text-sm font-medium text-foreground">
                  {sections.sidebarTitle}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {sections.sidebarBody}
                </p>
                <a
                  href={`mailto:${sidebarEmail}`}
                  className="mt-3 inline-flex text-sm font-medium text-accent transition-opacity hover:opacity-80"
                >
                  {sidebarEmail}
                </a>

                <div className="mt-5 border-t border-border pt-5">
                  <ContactSocialLinks socialLinks={settings.socialLinks} />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <FaqSection
        items={faqItems}
        eyebrow={sections.faqEyebrow}
        headline={sections.faqHeadline}
        description={sections.faqDescription}
        hideContactCard
      />
    </InnerPageShell>
  );
}
