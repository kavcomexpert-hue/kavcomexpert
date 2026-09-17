import { getContent, getLinkButton } from "@/lib/queries/content-blocks";
import { SiteLinkButton } from "@/components/site/site-link-button";

export async function CtaBand() {
  const [eyebrow, headline, body, button] = await Promise.all([
    getContent("global.cta_band.eyebrow"),
    getContent("global.cta_band.headline"),
    getContent("global.cta_band.body"),
    getLinkButton("global.cta_band.button"),
  ]);

  return (
    <section
      aria-labelledby="cta-band-heading"
      className="border-t border-border bg-surface py-16"
    >
      <div className="mx-auto flex max-w-[1120px] flex-col items-start gap-6 px-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl space-y-2">
          <p className="font-mono text-xs uppercase tracking-wider text-muted">
            {eyebrow}
          </p>
          <h2
            id="cta-band-heading"
            className="font-display text-3xl font-semibold tracking-tight text-foreground"
          >
            {headline}
          </h2>
          <p className="text-base leading-relaxed text-muted">{body}</p>
        </div>
        <SiteLinkButton
          button={button}
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-default bg-accent px-6 text-sm font-medium text-surface transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        />
      </div>
    </section>
  );
}
