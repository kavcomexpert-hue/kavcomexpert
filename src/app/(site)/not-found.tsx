import { getContent, getLinkButton } from "@/lib/queries/content-blocks";
import { SiteLinkButton } from "@/components/site/site-link-button";

export default async function NotFound() {
  const [headline, body, cta] = await Promise.all([
    getContent("global.404.headline"),
    getContent("global.404.body"),
    getLinkButton("global.404.cta"),
  ]);

  return (
    <section className="flex min-h-[60vh] items-center px-6 py-24">
      <div className="mx-auto max-w-[1120px] text-center">
        <h1 className="font-display text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
          {headline}
        </h1>
        <p className="mt-4 text-base text-muted">{body}</p>
        <SiteLinkButton
          button={cta}
          className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-surface transition-opacity hover:opacity-90"
        />
      </div>
    </section>
  );
}
