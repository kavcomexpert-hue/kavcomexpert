import { Ambient } from "@/components/site/home/motion/ambient";
import { BlurReveal } from "@/components/site/home/motion/blur-reveal";
import Image from "next/image";

type TechLogo = {
  name: string;
  src: string;
  /** White variant swapped in for dark mode (for near-black brand marks). */
  darkSrc?: string;
  /** Non-square marks get a wider intrinsic size. */
  wide?: boolean;
};

type TechCategory = {
  title: string;
  description: string;
  logos: TechLogo[];
};

const categories: TechCategory[] = [
  {
    title: "Web & app development",
    description:
      "Platforms, languages, and frameworks powering our websites, stores, and mobile apps.",
    logos: [
      { name: "WordPress", src: "/tech/wordpress.svg" },
      { name: "Shopify", src: "/tech/shopify.svg" },
      { name: "Magento", src: "/tech/magento.svg" },
      { name: "WooCommerce", src: "/tech/woocommerce.svg" },
      { name: "PHP", src: "/tech/php.svg" },
      { name: "React", src: "/tech/react.svg" },
      { name: "Node.js", src: "/tech/nodejs.svg" },
      { name: "Swift", src: "/tech/swift.svg" },
      { name: "Kotlin", src: "/tech/kotlin.svg" },
    ],
  },
  {
    title: "Marketing, design & content",
    description:
      "The tools behind our campaigns, analytics, creative, and content production.",
    logos: [
      { name: "Google Ads", src: "/tech/google-ads.svg" },
      { name: "Google Analytics", src: "/tech/google-analytics.svg" },
      { name: "Meta", src: "/tech/meta.svg" },
      { name: "Semrush", src: "/tech/semrush.svg" },
      { name: "HubSpot", src: "/tech/hubspot.svg" },
      { name: "Figma", src: "/tech/figma.svg" },
      { name: "YouTube", src: "/tech/youtube.svg" },
    ],
  },
  {
    title: "Cloud, payments & infrastructure",
    description:
      "Hosting, security, payments, and delivery pipelines that keep everything fast and reliable.",
    logos: [
      {
        name: "AWS",
        src: "/tech/aws.svg",
        darkSrc: "/tech/aws-dark.svg",
        wide: true,
      },
      { name: "Cloudflare", src: "/tech/cloudflare.svg" },
      { name: "Google Cloud", src: "/tech/google-cloud.svg" },
      { name: "Docker", src: "/tech/docker.svg" },
      { name: "Stripe", src: "/tech/stripe.svg" },
      {
        name: "PayPal",
        src: "/tech/paypal.svg",
        darkSrc: "/tech/paypal-dark.svg",
      },
      {
        name: "GitHub",
        src: "/tech/github.svg",
        darkSrc: "/tech/github-dark.svg",
      },
    ],
  },
];

function LogoChip({ logo }: { logo: TechLogo }) {
  const imageClass = logo.wide
    ? "h-4.5 w-auto object-contain"
    : "size-5 object-contain";
  const width = logo.wide ? 34 : 20;

  return (
    <li className="flex items-center gap-2.5 rounded-full border border-border bg-background py-2 pl-3 pr-3.5 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-accent">
      {/* Decorative: the visible label next to it names the brand */}
      <Image
        src={logo.src}
        alt=""
        width={width}
        height={20}
        loading="lazy"
        className={logo.darkSrc ? `${imageClass} dark:hidden` : imageClass}
      />
      {logo.darkSrc ? (
        <Image
          src={logo.darkSrc}
          alt=""
          width={width}
          height={20}
          loading="lazy"
          className={`${imageClass} hidden dark:block`}
        />
      ) : null}
      <span className="whitespace-nowrap text-xs font-medium text-foreground">
        {logo.name}
      </span>
    </li>
  );
}

function normalizeCategories(list: TechCategory[]): TechCategory[] {
  return list.map((category) => ({
    ...category,
    logos: category.logos.map((logo) => ({
      ...logo,
      darkSrc: logo.darkSrc ? logo.darkSrc : undefined,
    })),
  }));
}

export function TechStackSection({
  animated = true,
  eyebrow = "Our tech stack",
  headline = "The technologies behind the results",
  body = "We work with proven, industry-standard platforms and tools, so your project is built on technology that lasts.",
  categories: categoriesProp,
}: {
  animated?: boolean;
  eyebrow?: string;
  headline?: string;
  body?: string;
  categories?: TechCategory[];
}) {
  const Header = animated ? BlurReveal : "div";
  const Item = animated ? BlurReveal : "div";
  const resolvedCategories = normalizeCategories(
    categoriesProp && categoriesProp.length > 0 ? categoriesProp : categories,
  );

  return (
    <section className="relative overflow-clip bg-background py-20 md:py-28">
      <Ambient />
      <div className="relative mx-auto max-w-[1120px] px-6">
        <Header className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-accent">{eyebrow}</p>
          <h2 className="mt-4 text-balance text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-foreground">
            {headline}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted">{body}</p>
        </Header>

        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {resolvedCategories.map((category, index) => (
            <Item key={category.title} {...(animated ? { delay: index * 0.08 } : {})}>
              <article className="group flex h-full flex-col rounded-default border border-border bg-surface p-7 shadow-soft transition-[border-color] duration-300 hover:border-accent dark:shadow-none dark:hover:shadow-glow">
                <span className="text-sm tabular-nums text-muted">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-xl font-semibold tracking-[-0.02em] text-foreground">
                  {category.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted">
                  {category.description}
                </p>
                <ul className="mt-6 flex flex-wrap gap-2.5">
                  {category.logos.map((logo) => (
                    <LogoChip key={logo.name} logo={logo} />
                  ))}
                </ul>
              </article>
            </Item>
          ))}
        </div>
      </div>
    </section>
  );
}
