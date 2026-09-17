import type { ReactNode } from "react";

type SectionProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  eyebrow?: string;
  headline?: string;
  headlineAs?: "h1" | "h2";
  subtext?: string;
};

export function Section({
  children,
  className = "",
  id,
  eyebrow,
  headline,
  headlineAs = "h2",
  subtext,
}: SectionProps) {
  const hasHeader = Boolean(eyebrow || headline || subtext);
  const HeadlineTag = headlineAs;

  return (
    <section id={id} className={`py-16 md:py-24 ${className}`.trim()}>
      <div className="mx-auto max-w-[1120px] px-6">
        {hasHeader ? (
          <header className="mb-12 max-w-2xl space-y-4 md:mb-16">
            {eyebrow ? (
              <p className="font-mono text-xs uppercase tracking-wider text-muted">
                {eyebrow}
              </p>
            ) : null}
            {headline ? (
              <HeadlineTag className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {headline}
              </HeadlineTag>
            ) : null}
            {subtext ? (
              <p className="text-base leading-relaxed text-muted md:text-lg">
                {subtext}
              </p>
            ) : null}
          </header>
        ) : null}
        {children}
      </div>
    </section>
  );
}
