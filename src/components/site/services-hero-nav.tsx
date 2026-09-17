"use client";

const heroAnchors = [
  { label: "Web & app development", href: "#web-development" },
  { label: "Digital marketing", href: "#digital-marketing" },
  { label: "Add-on services", href: "#add-on-services" },
] as const;

export function ServicesHeroNav({
  items = heroAnchors,
}: {
  items?: readonly { label: string; href: string }[];
} = {}) {
  const anchors = items.length > 0 ? items : heroAnchors;

  return (
    <nav
      aria-label="Jump to service categories"
      className="animate-enter mt-10 flex flex-wrap items-center justify-center gap-3"
      style={{ animationDelay: "0.38s" }}
    >
      {anchors.map((anchor) => (
        <a
          key={anchor.href}
          href={anchor.href}
          className="group inline-flex min-h-11 items-center gap-2.5 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-medium text-foreground transition-colors duration-300 hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {anchor.label}
          <span
            aria-hidden="true"
            className="inline-block transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0.5"
          >
            ↓
          </span>
        </a>
      ))}
    </nav>
  );
}
