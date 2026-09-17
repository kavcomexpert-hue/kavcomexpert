"use client";

import { ArrowUpRight, ChevronRight } from "lucide-react";

import {
  IconAndroid,
  IconGoogleAds,
  IconMagento,
  IconMarketing,
  IconSeo,
  IconShopify,
  IconUiUx,
  IconWooCommerce,
  IconWordPress,
} from "@/components/site/home/motion/tech-icons";
import { motionEase } from "@/components/site/motion/reveal";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import Image from "next/image";
import { SiteLinkButton } from "@/components/site/site-link-button";
import { linkButton, type LinkButton } from "@/lib/content/link-button";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

const rotatingWords = [
  "Digital Marketing",
  "WordPress",
  "Shopify",
  "WooCommerce",
  "Video Editing",
  "Branding",
  "UI/UX",
] as const;

const techBadges: Array<{
  label: string;
  icon: ReactNode;
  position: string;
  drift: number;
  duration: number;
  /** How far (px) the badge travels while the hero scrolls away. */
  depth: number;
}> = [
  { label: "WordPress", icon: <IconWordPress />, position: "left-[2%] top-[6%]", drift: -8, duration: 5, depth: -150 },
  { label: "Shopify", icon: <IconShopify />, position: "right-[4%] top-[0%]", drift: 7, duration: 6, depth: -220 },
  { label: "Magento", icon: <IconMagento />, position: "left-[-4%] top-[40%]", drift: 6, duration: 5.5, depth: -90 },
  { label: "WooCommerce", icon: <IconWooCommerce />, position: "left-[38%] top-[24%]", drift: -7, duration: 6.5, depth: -260 },
  { label: "Google Ads", icon: <IconGoogleAds />, position: "right-[-2%] top-[46%]", drift: -6, duration: 5.2, depth: -130 },
  { label: "Digital Marketing", icon: <IconMarketing />, position: "left-[8%] bottom-[22%]", drift: 8, duration: 6.2, depth: -190 },
  { label: "SEO & AI SEO", icon: <IconSeo />, position: "right-[10%] bottom-[14%]", drift: -8, duration: 5.8, depth: -240 },
  { label: "UI/UX Design", icon: <IconUiUx />, position: "left-[34%] bottom-[0%]", drift: 6, duration: 6.8, depth: -110 },
  { label: "App Development", icon: <IconAndroid />, position: "right-[24%] top-[20%]", drift: 7, duration: 5.4, depth: -170 },
];

function RotatingWord({
  words = rotatingWords,
}: {
  words?: readonly string[];
}) {
  const list = words.length > 0 ? words : rotatingWords;
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [animateReady, setAnimateReady] = useState(false);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    // Let the LCP H1 settle before starting Motion word cycles.
    const start = window.setTimeout(() => setAnimateReady(true), 1200);
    return () => window.clearTimeout(start);
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion || !animateReady) {
      return;
    }

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % list.length);
    }, 2400);

    return () => window.clearInterval(timer);
  }, [reducedMotion, animateReady, list.length]);

  const fallback = list[0] ?? "Digital Marketing";
  const current = list[index % list.length] ?? fallback;

  if (reducedMotion || !animateReady) {
    return <span className="text-accent">{fallback}</span>;
  }

  return (
    <span className="relative inline-block align-top text-accent">
      <span className="invisible whitespace-nowrap" aria-hidden="true">
        {fallback}
      </span>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={current}
          className="absolute inset-y-0 left-0 whitespace-nowrap"
          initial={{ opacity: 0, y: "40%", filter: "blur(16px)" }}
          animate={{ opacity: 1, y: "0%", filter: "blur(0px)" }}
          exit={{ opacity: 0, y: "-40%", filter: "blur(16px)" }}
          transition={{ duration: 0.55, ease: motionEase }}
        >
          {current}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function TechBadge({
  badge,
  index,
  progress,
  reducedMotion,
}: {
  badge: (typeof techBadges)[number];
  index: number;
  progress: MotionValue<number>;
  reducedMotion: boolean;
}) {
  const y = useTransform(progress, [0, 1], [0, badge.depth]);

  return (
    <div className={`absolute ${badge.position}`}>
      <motion.div style={reducedMotion ? undefined : { y }}>
        <motion.div
          initial={
            reducedMotion
              ? false
              : { opacity: 0, scale: 0.85, filter: "blur(10px)" }
          }
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{
            duration: 0.6,
            ease: motionEase,
            delay: 0.5 + index * 0.07,
          }}
        >
          <motion.div
            className="flex cursor-default items-center gap-2.5 rounded-full border border-border bg-surface/90 py-2.5 pl-3.5 pr-4 shadow-soft backdrop-blur-sm transition-colors duration-300 hover:border-accent dark:shadow-glow"
            animate={reducedMotion ? undefined : { y: [0, badge.drift, 0] }}
            transition={{
              duration: badge.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.3,
            }}
            whileHover={reducedMotion ? undefined : { scale: 1.08 }}
          >
            <span className="text-accent">{badge.icon}</span>
            <span className="whitespace-nowrap text-xs font-medium text-foreground">
              {badge.label}
            </span>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export type TechBadgeCmsItem = {
  label: string;
  iconKey: string;
};

function resolveTechBadges(items?: TechBadgeCmsItem[] | string[]) {
  if (!items || items.length === 0) return techBadges;
  const byKey = new Map(techBadges.map((badge) => [badge.label, badge]));
  const normalized: TechBadgeCmsItem[] = items.map((item) =>
    typeof item === "string"
      ? { label: item, iconKey: item }
      : {
          label: item.label,
          iconKey: item.iconKey || item.label,
        },
  );
  const resolved = normalized.map((item, index) => {
    const template =
      byKey.get(item.iconKey) ??
      byKey.get(item.label) ??
      techBadges[index % techBadges.length];
    return {
      ...template,
      label: item.label.trim() || template.label,
    };
  });
  return resolved.length > 0 ? resolved : techBadges;
}

function TechField({
  progress,
  reducedMotion,
  badges,
}: {
  progress: MotionValue<number>;
  reducedMotion: boolean;
  badges: typeof techBadges;
}) {
  const fieldOpacity = useTransform(progress, [0, 0.55], [1, 0]);
  const ringRotate = useTransform(progress, [0, 1], [0, 80]);
  const ringRotateReverse = useTransform(progress, [0, 1], [0, -60]);
  const emblemY = useTransform(progress, [0, 1], [0, -80]);
  const emblemScale = useTransform(progress, [0, 1], [1, 0.85]);

  return (
    <motion.div
      className="relative hidden aspect-square max-w-[480px] lg:block"
      aria-hidden="true"
      style={reducedMotion ? undefined : { opacity: fieldOpacity }}
    >
      {/* Rotating orbit rings */}
      <div className="absolute left-1/2 top-1/2 size-[74%] -translate-x-1/2 -translate-y-1/2">
        <motion.div
          className="size-full rounded-full border border-dashed border-border"
          style={reducedMotion ? undefined : { rotate: ringRotate }}
        >
          <motion.div
            className="absolute inset-0"
            animate={reducedMotion ? undefined : { rotate: 360 }}
            transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          >
            <span className="absolute left-1/2 top-0 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" />
          </motion.div>
        </motion.div>
      </div>
      <div className="absolute left-1/2 top-1/2 size-[46%] -translate-x-1/2 -translate-y-1/2">
        <motion.div
          className="size-full rounded-full border border-border/80"
          style={reducedMotion ? undefined : { rotate: ringRotateReverse }}
        >
          <motion.div
            className="absolute inset-0"
            animate={reducedMotion ? undefined : { rotate: -360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <span className="absolute left-1/2 top-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-lime" />
          </motion.div>
        </motion.div>
      </div>

      {/* Glow + center brand emblem */}
      <div className="absolute left-1/2 top-1/2 size-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-2xl" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          style={reducedMotion ? undefined : { y: emblemY, scale: emblemScale }}
          initial={reducedMotion ? false : { opacity: 0, scale: 0.7, filter: "blur(12px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease: motionEase, delay: 0.4 }}
        >
          <div className="flex size-28 items-center justify-center rounded-full border border-border bg-surface shadow-soft dark:shadow-glow">
            <Image
              src="/logo.png"
              alt=""
              width={64}
              height={64}
              className="size-16 object-contain"
            />
          </div>
        </motion.div>
      </div>

      {badges.map((badge, index) => (
        <TechBadge
          key={badge.label}
          badge={badge}
          index={index}
          progress={progress}
          reducedMotion={reducedMotion}
        />
      ))}
    </motion.div>
  );
}

type HeroSectionProps = {
  eyebrow?: string;
  headlineLine1?: string;
  headlineLine2?: string;
  subtext?: string;
  ctaPrimary?: LinkButton;
  ctaSecondary?: LinkButton;
  rotatingWords?: readonly string[];
  /** @deprecated use techBadges */
  techBadgeLabels?: string[];
  techBadges?: TechBadgeCmsItem[];
};

const DEFAULT_CTA_PRIMARY = linkButton("Get in touch", "/contact-us");
const DEFAULT_CTA_SECONDARY = linkButton("All services", "/services");

export function HeroSection({
  eyebrow = "Full-service digital agency",
  headlineLine1 = "Innovative",
  headlineLine2 = "solutions for",
  subtext = "We build scalable websites on Shopify, Magento, WordPress, and WooCommerce, and deliver measurable results through SEO, PPC, and social media marketing.",
  ctaPrimary = DEFAULT_CTA_PRIMARY,
  ctaSecondary = DEFAULT_CTA_SECONDARY,
  rotatingWords: rotatingWordsProp,
  techBadgeLabels,
  techBadges: techBadgesProp,
}: HeroSectionProps = {}) {
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const badges = resolveTechBadges(techBadgesProp ?? techBadgeLabels);
  // Desktop-only parallax field: skip Motion scroll work on mobile (LCP/TBT).
  const [desktopField, setDesktopField] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setDesktopField(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden bg-background"
    >
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-50"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--border) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage:
            "radial-gradient(ellipse at 70% 50%, black 20%, transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 70% 50%, black 20%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto grid w-full max-w-[1120px] gap-14 px-6 pb-16 pt-32 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-6 lg:pb-20 lg:pt-24">
        <HeroTextStatic
          eyebrow={eyebrow}
          headlineLine1={headlineLine1}
          headlineLine2={headlineLine2}
          subtext={subtext}
          ctaPrimary={ctaPrimary}
          ctaSecondary={ctaSecondary}
          rotatingWords={rotatingWordsProp}
        />

        {desktopField ? (
          <HeroTechFieldBridge
            sectionRef={sectionRef}
            reducedMotion={reducedMotion}
            badges={badges}
          />
        ) : null}

        {/* Tech chips, mobile/tablet */}
        <div className="lg:hidden">
          <div className="flex flex-wrap gap-2.5" aria-hidden="true">
            {badges.map((badge) => (
              <span
                key={badge.label}
                className="flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-2 text-xs font-medium text-foreground"
              >
                <span className="text-accent">{badge.icon}</span>
                {badge.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

type HeroCopyProps = {
  eyebrow: string;
  headlineLine1: string;
  headlineLine2: string;
  subtext: string;
  ctaPrimary: LinkButton;
  ctaSecondary: LinkButton;
  rotatingWords?: readonly string[];
};

/** First-paint copy — H1 is never opacity:0 so mobile LCP stays green. */
function HeroTextStatic({
  eyebrow,
  headlineLine1,
  headlineLine2,
  subtext,
  ctaPrimary,
  ctaSecondary,
  rotatingWords: rotatingWordsProp,
}: HeroCopyProps) {
  return (
    <div>
      <div className="animate-enter" style={{ animationDelay: "0.05s" }}>
        <p className="inline-flex items-center gap-2.5 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-muted">
          <span className="relative flex size-2" aria-hidden="true">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent-lime opacity-60 motion-reduce:hidden" />
            <span className="relative inline-flex size-2 rounded-full bg-accent-lime" />
          </span>
          {eyebrow}
        </p>
      </div>

      <h1 className="mt-8 text-balance text-[clamp(2.75rem,7vw,5.5rem)] font-semibold leading-[0.98] tracking-[-0.045em] text-foreground [text-wrap:balance]">
        <span className="block">{headlineLine1}</span>
        <span className="block">{headlineLine2}</span>
        <span className="block">
          <RotatingWord words={rotatingWordsProp} />
        </span>
      </h1>

      <p
        className="animate-enter mt-7 max-w-xl text-base leading-relaxed text-muted md:text-lg"
        style={{ animationDelay: "0.2s" }}
      >
        {subtext}
      </p>

      <div className="animate-enter" style={{ animationDelay: "0.28s" }}>
        <div className="mt-9 flex flex-wrap items-center gap-4">
          <SiteLinkButton
            button={ctaPrimary}
            className="group inline-flex h-13 items-center justify-center gap-3 rounded-full bg-accent py-3.5 pl-8 pr-3.5 text-sm font-medium text-surface transition-transform duration-300 hover:scale-[1.03] active:scale-[0.98]"
          >
            <>
              {ctaPrimary.label}
              <span
                aria-hidden="true"
                className="flex size-7 items-center justify-center rounded-full bg-surface/20 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:rotate-45"
              >
                <ArrowUpRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
              </span>
            </>
          </SiteLinkButton>
          <SiteLinkButton
            button={ctaSecondary}
            className="group inline-flex items-center gap-2 text-sm font-medium text-foreground"
          >
            <>
              {ctaSecondary.label}
              <span
                aria-hidden="true"
                className="inline-block transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1.5"
              >
                <ChevronRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
              </span>
            </>
          </SiteLinkButton>
        </div>
      </div>
    </div>
  );
}

function HeroTechFieldBridge({
  sectionRef,
  reducedMotion,
  badges,
}: {
  sectionRef: RefObject<HTMLElement | null>;
  reducedMotion: boolean;
  badges: typeof techBadges;
}) {
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  return (
    <TechField
      progress={scrollYProgress}
      reducedMotion={reducedMotion}
      badges={badges}
    />
  );
}
