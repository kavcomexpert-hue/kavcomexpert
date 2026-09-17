import { Ambient } from "@/components/site/home/motion/ambient";
import { BlurReveal } from "@/components/site/home/motion/blur-reveal";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { CountUp } from "@/components/site/motion/count-up";
import { SiteLinkButton } from "@/components/site/site-link-button";
import { linkButton, type LinkButton } from "@/lib/content/link-button";
import type { ReactNode } from "react";
import { ArrowUpRight, ChevronRight } from "lucide-react";

function IconTarget({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

function IconEye({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <path
        d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconSpark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <path
        d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3.5 18.5c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5M14 14c2.2.2 3.8 1.4 4.5 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconGlobe({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3 12h18M12 3c2.5 2.8 3.8 5.8 3.8 9S14.5 18.2 12 21c-2.5-2.8-3.8-5.8-3.8-9S9.5 5.8 12 3z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function IconShield({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <path
        d="M12 3l8 3v6c0 5-3.4 8.4-8 9.5C7.4 20.4 4 17 4 12V6l8-3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 7v5l3 2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconRepeat({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <path
        d="M17 3l3 3-3 3M7 21l-3-3 3-3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 6H9a5 5 0 000 10h1M4 18h11a5 5 0 000-10h-1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconSliders({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <path
        d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M8 14v6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconChat({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <path
        d="M5 5h14a2 2 0 012 2v8a2 2 0 01-2 2H9l-4 3v-3H5a2 2 0 01-2-2V7a2 2 0 012-2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AboutHero({
  eyebrow = "About us",
  headline = "Digital partners for ambitious brands",
  subtext = "We build websites, apps, and growth systems that help businesses get found, trusted, and chosen.",
  cta = linkButton("Work with us", "/contact-us"),
}: {
  eyebrow?: string;
  headline?: string;
  subtext?: string;
  cta?: LinkButton;
} = {}) {
  return (
    <section className="relative overflow-clip bg-background pb-14 pt-28 md:pb-20 md:pt-36">
      <Ambient />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[8%] top-[20%] size-[min(42vw,320px)] rounded-full bg-accent/10 blur-3xl dark:bg-accent/20"
      />

      <div className="relative mx-auto max-w-[1120px] px-6">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "About Us" },
          ]}
        />

        <div className="mt-14 max-w-3xl md:mt-16">
          <p
            className="animate-enter text-sm font-medium text-accent"
            style={{ animationDelay: "0.05s" }}
          >
            {eyebrow}
          </p>
          <h1
            className="animate-enter mt-4 text-balance text-[clamp(2.75rem,7vw,5.5rem)] font-semibold leading-[0.96] tracking-[-0.045em] text-foreground"
            style={{ animationDelay: "0.12s" }}
          >
            {headline === "Digital partners for ambitious brands" ? (
              <>
                Digital partners for{" "}
                <span className="text-accent">ambitious brands</span>
              </>
            ) : (
              headline
            )}
          </h1>
          <p
            className="animate-enter mt-5 max-w-xl text-base leading-relaxed text-muted md:text-lg"
            style={{ animationDelay: "0.2s" }}
          >
            {subtext}
          </p>
          <div
            className="animate-enter mt-8"
            style={{ animationDelay: "0.28s" }}
          >
            <SiteLinkButton
              button={cta}
              className="group inline-flex h-12 items-center justify-center gap-3 rounded-full bg-accent py-3 pl-6 pr-3 text-sm font-medium text-surface transition-transform duration-300 hover:scale-[1.03] active:scale-[0.98]"
            >
              <>
                {cta.label}
                <span
                  aria-hidden="true"
                  className="flex size-7 items-center justify-center rounded-full bg-surface/20 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:rotate-45"
                >
                  <ArrowUpRight
                    className="size-4"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </span>
              </>
            </SiteLinkButton>
          </div>
        </div>
      </div>
    </section>
  );
}

const DEFAULT_MISSION_ITEMS = [
  {
    eyebrow: "Our Mission",
    title: "Elevate every brand connection",
    body: "Delivering transformative digital solutions that elevate brand connections and turn attention into lasting customer relationships.",
  },
  {
    eyebrow: "Our Vision",
    title: "Shape the future of digital growth",
    body: "Shaping the future through innovative and impactful digital experiences that help ambitious brands lead their markets.",
  },
  {
    eyebrow: "Our Values",
    title: "Integrity at every step",
    body: "Integrity, creativity, innovation, collaboration, excellence, and results guide how we plan, build, and partner with every client.",
  },
] as const;

const MISSION_ICONS: ReactNode[] = [
  <IconTarget key="mission" className="size-6" />,
  <IconEye key="vision" className="size-6" />,
  <IconSpark key="values" className="size-6" />,
];

export function AboutMissionVisionValues({
  eyebrow = "What drives us",
  headline = "Mission, vision, and values",
  items = DEFAULT_MISSION_ITEMS,
}: {
  eyebrow?: string;
  headline?: string;
  items?: readonly { eyebrow: string; title: string; body: string }[];
} = {}) {
  return (
    <section
      id="mission-vision-values"
      className="relative overflow-clip bg-background py-20 md:py-28"
    >
      <Ambient />
      <div className="relative mx-auto max-w-[1120px] px-6">
        <BlurReveal className="max-w-2xl">
          <p className="text-sm font-medium text-accent">{eyebrow}</p>
          <h2 className="mt-4 text-balance text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-foreground">
            {headline}
          </h2>
        </BlurReveal>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {items.map((item, index) => (
            <BlurReveal key={`${item.eyebrow}-${index}`} delay={index * 0.08}>
              <article className="group relative flex h-full flex-col overflow-hidden rounded-default border border-border bg-surface p-7 transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-soft dark:hover:shadow-glow md:p-8">
                <div
                  aria-hidden="true"
                  className="absolute -right-10 -top-10 size-28 rounded-full bg-accent/0 blur-2xl transition-[background-color] duration-500 group-hover:bg-accent/15"
                />
                <div className="relative flex size-14 items-center justify-center rounded-full border border-border bg-background text-accent transition-[border-color,background-color,color] duration-300 group-hover:border-accent group-hover:bg-accent group-hover:text-surface">
                  {MISSION_ICONS[index % MISSION_ICONS.length]}
                </div>
                <p className="relative mt-8 text-sm font-medium text-accent">
                  {item.eyebrow}
                </p>
                <h3 className="relative mt-3 text-2xl font-semibold tracking-[-0.02em] text-foreground">
                  {item.title}
                </h3>
                <p className="relative mt-4 text-sm leading-relaxed text-muted md:text-base">
                  {item.body}
                </p>
                <span
                  aria-hidden="true"
                  className="relative mt-8 block h-1 w-10 rounded-full bg-accent/30 transition-[width,background-color] duration-300 group-hover:w-16 group-hover:bg-accent"
                />
              </article>
            </BlurReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const DEFAULT_STATS = [
  { metric: "8+", label: "Years of experience" },
  { metric: "200+", label: "Projects completed" },
  { metric: "25+", label: "Team members" },
  { metric: "98%", label: "Client satisfaction" },
] as const;

const STAT_ICONS: ReactNode[] = [
  <IconClock key="years" className="size-5" />,
  <IconSpark key="projects" className="size-5" />,
  <IconUsers key="team" className="size-5" />,
  <IconShield key="satisfaction" className="size-5" />,
];

const DEFAULT_WHO_HIGHLIGHTS = [
  {
    title: "One accountable team",
    body: "Strategy, design, development, and marketing stay aligned so nothing falls between vendors.",
  },
  {
    title: "Built for operators",
    body: "We work with startups, SMBs, agencies, and growing enterprises that need practical outcomes.",
  },
  {
    title: "Global reach, local care",
    body: "Most of our work supports brands across the US, Canada, and international markets.",
  },
] as const;

const WHO_HIGHLIGHT_ICONS: ReactNode[] = [
  <IconUsers key="team" className="size-5" />,
  <IconTarget key="operators" className="size-5" />,
  <IconGlobe key="global" className="size-5" />,
];

export function AboutWho({
  eyebrow = "Who we are",
  headlineLead = "Experts in",
  headlineAccent = "digital brand innovation",
  body = "We transform brands with digital strategy, creative craft, and reliable engineering. From WordPress and Shopify to custom apps, SEO, paid media, and virtual assistance, we operate as one team.",
  tags = ["Web", "Apps", "SEO", "Ads", "Design", "VA"],
  highlights = DEFAULT_WHO_HIGHLIGHTS,
  stats = DEFAULT_STATS,
}: {
  eyebrow?: string;
  headlineLead?: string;
  headlineAccent?: string;
  body?: string;
  tags?: readonly string[];
  highlights?: readonly { title: string; body: string }[];
  stats?: readonly { metric: string; label: string }[];
} = {}) {
  return (
    <section
      id="who-we-are"
      className="relative overflow-clip border-t border-border bg-surface py-20 md:py-28"
    >
      <Ambient flip />
      <div className="relative mx-auto max-w-[1120px] px-6">
        <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          <BlurReveal>
            <p className="text-sm font-medium text-accent">{eyebrow}</p>
            <h2 className="mt-4 text-balance text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-foreground">
              {headlineLead}{" "}
              <span className="text-accent">{headlineAccent}</span>
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted">
              {body}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-medium text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          </BlurReveal>

          <div className="space-y-4">
            {highlights.map((item, index) => (
              <BlurReveal key={`${item.title}-${index}`} delay={index * 0.06}>
                <div className="group rounded-default border border-border bg-background p-5 transition-colors duration-300 hover:border-accent md:p-6">
                  <div className="flex items-start gap-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-accent transition-[border-color,background-color,color] duration-300 group-hover:border-accent group-hover:bg-accent group-hover:text-surface">
                      {
                        WHO_HIGHLIGHT_ICONS[
                          index % WHO_HIGHLIGHT_ICONS.length
                        ]
                      }
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold tracking-[-0.02em] text-foreground">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted">
                        {item.body}
                      </p>
                    </div>
                  </div>
                </div>
              </BlurReveal>
            ))}
          </div>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <BlurReveal key={`${stat.label}-${index}`} delay={index * 0.05}>
              <div className="flex h-full flex-col justify-between rounded-default border border-border bg-background p-5 md:p-6">
                <span className="flex size-9 items-center justify-center rounded-full bg-accent/10 text-accent">
                  {STAT_ICONS[index % STAT_ICONS.length]}
                </span>
                <div className="mt-6">
                  <p className="font-display text-3xl font-semibold tracking-[-0.04em] text-accent md:text-4xl">
                    <CountUp metric={stat.metric} />
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {stat.label}
                  </p>
                </div>
              </div>
            </BlurReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const DEFAULT_WHY_REASONS = [
  {
    index: "01",
    title: "24/7 Support",
    body: "Our dedicated support team is available around the clock to address your concerns and provide assistance whenever you need it.",
  },
  {
    index: "02",
    title: "90% Repeat Business",
    body: "Our high client retention rate speaks volumes about the quality of our work and the trust our clients place in us.",
  },
  {
    index: "03",
    title: "Custom Solutions",
    body: "We tailor our services to meet your specific needs, ensuring you get exactly what your business requires to succeed.",
  },
  {
    index: "04",
    title: "Transparent Communication",
    body: "We believe in open and honest communication, keeping you informed and involved throughout the entire process.",
  },
] as const;

const WHY_ICONS: ReactNode[] = [
  <IconClock key="support" className="size-5" />,
  <IconRepeat key="repeat" className="size-5" />,
  <IconSliders key="custom" className="size-5" />,
  <IconChat key="comms" className="size-5" />,
];

export function AboutWhy({
  eyebrow = "Why choose us",
  headlineLead = "Built for",
  headlineAccent = "long-term growth",
  body = "Quality, innovation, and client success make us the preferred digital partner for businesses worldwide.",
  reasons = DEFAULT_WHY_REASONS,
  cta = linkButton("Start a project", "/contact-us"),
}: {
  eyebrow?: string;
  headlineLead?: string;
  headlineAccent?: string;
  body?: string;
  reasons?: readonly { index: string; title: string; body: string }[];
  cta?: LinkButton;
} = {}) {
  return (
    <section className="relative overflow-clip border-t border-border bg-surface py-20 md:py-28">
      <Ambient flip />
      <div className="relative mx-auto max-w-[1120px] px-6">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <BlurReveal>
              <p className="text-sm font-medium text-accent">{eyebrow}</p>
              <h2 className="mt-4 text-balance text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-foreground">
                {headlineLead}{" "}
                <span className="text-accent">{headlineAccent}</span>
              </h2>
              <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
                {body}
              </p>
              <SiteLinkButton
                button={cta}
                className="group mt-8 inline-flex items-center gap-2 text-sm font-medium text-foreground"
              >
                <>
                  {cta.label}
                  <span
                    aria-hidden="true"
                    className="inline-block transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1.5"
                  >
                    <ChevronRight
                      className="size-4"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  </span>
                </>
              </SiteLinkButton>
            </BlurReveal>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {reasons.map((reason, index) => (
              <BlurReveal key={`${reason.title}-${index}`} delay={index * 0.06}>
                <article className="group relative flex h-full flex-col overflow-hidden rounded-default border border-border bg-background p-6 transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-soft dark:hover:shadow-glow md:p-7">
                  <div className="relative flex items-center justify-between gap-3">
                    <span className="flex size-11 items-center justify-center rounded-full border border-border bg-surface text-accent transition-[border-color,background-color,color] duration-300 group-hover:border-accent group-hover:bg-accent group-hover:text-surface">
                      {WHY_ICONS[index % WHY_ICONS.length]}
                    </span>
                    <span className="text-sm font-medium tabular-nums text-muted">
                      {reason.index}
                    </span>
                  </div>
                  <h3 className="relative mt-8 text-xl font-semibold tracking-[-0.02em] text-foreground transition-colors duration-300 group-hover:text-accent">
                    {reason.title}
                  </h3>
                  <p className="relative mt-3 text-sm leading-relaxed text-muted">
                    {reason.body}
                  </p>
                </article>
              </BlurReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
