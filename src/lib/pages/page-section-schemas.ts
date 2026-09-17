import { linkButton, linkButtonZodField } from "@/lib/content/link-button";
import { z } from "zod";

const tolerantString = z
  .string()
  .nullish()
  .transform((v) => v ?? "");

const tolerantStringDefault = (fallback: string) =>
  z
    .string()
    .nullish()
    .transform((value) => (value == null || value === "" ? fallback : value));

const faqItemSchema = z.object({
  question: tolerantString,
  answer: tolerantString,
});

const logoItemSchema = z.object({
  name: tolerantString,
  src: tolerantString,
});

const serviceCardItemSchema = z.object({
  slug: tolerantString,
  name: tolerantString,
  description: tolerantString,
  href: tolerantString,
});

const techLogoSchema = z.object({
  name: tolerantString,
  src: tolerantString,
  darkSrc: tolerantString,
  wide: z.boolean().nullish().transform((v) => Boolean(v)),
});

const techCategorySchema = z.object({
  title: tolerantString,
  description: tolerantString,
  logos: z.array(techLogoSchema).default([]),
});

/** Hero block shared by work, contact, careers index pages. */
export const pageHeroSchema = z.object({
  eyebrow: tolerantString,
  headline: tolerantString,
  subtext: tolerantString,
});

export const workPageSectionsSchema = z.object({
  hero: z
    .object({
      eyebrow: tolerantStringDefault("Work"),
      headline: tolerantStringDefault("Work that moved the needle"),
      subtext: tolerantStringDefault(
        "Real projects for real clients, with the numbers to prove it. Browse the case studies, or dip into the gallery below.",
      ),
    })
    .default({
      eyebrow: "Work",
      headline: "Work that moved the needle",
      subtext:
        "Real projects for real clients, with the numbers to prove it. Browse the case studies, or dip into the gallery below.",
    }),
  gallery: z
    .object({
      eyebrow: tolerantStringDefault("Graphic gallery"),
      headline: tolerantStringDefault("Visuals from the workbench"),
      subtext: tolerantStringDefault(
        "A rotating look at brand, UI, and campaign graphics we ship alongside the builds above. Click any frame to open the full lightbox.",
      ),
    })
    .default({
      eyebrow: "Graphic gallery",
      headline: "Visuals from the workbench",
      subtext:
        "A rotating look at brand, UI, and campaign graphics we ship alongside the builds above. Click any frame to open the full lightbox.",
    }),
});

export const careersPageSectionsSchema = z.object({
  hero: z
    .object({
      eyebrow: tolerantStringDefault("Careers"),
      headline: tolerantStringDefault(
        "Build things that matter with Kavcom Expert",
      ),
      subtext: tolerantStringDefault(
        "A small, focused team building meaningful projects for growing businesses worldwide.",
      ),
    })
    .default({
      eyebrow: "Careers",
      headline: "Build things that matter with Kavcom Expert",
      subtext:
        "A small, focused team building meaningful projects for growing businesses worldwide.",
    }),
  openingsTitle: tolerantString.default("Open positions"),
  fallbackTitle: tolerantString.default("Don't see a perfect fit?"),
  fallbackBody: tolerantString.default(
    "We sometimes hire for roles before they're publicly listed. If you think you'd be a great addition, reach out directly.",
  ),
  fallbackEmail: tolerantString.default("career@kavcomexpert.com"),
  fallbackButtonLabel: tolerantString.default("Get in touch"),
  applyNameLabel: tolerantString.default("Full name"),
  applyNamePlaceholder: tolerantString.default("Jane Smith"),
  applyEmailLabel: tolerantString.default("Email address"),
  applyEmailPlaceholder: tolerantString.default("jane@example.com"),
  applyPhoneLabel: tolerantString.default("Phone"),
  applyPhonePlaceholder: tolerantString.default("+1 555 000 0000"),
  applyLinkedinLabel: tolerantString.default("LinkedIn URL"),
  applyLinkedinPlaceholder: tolerantString.default("https://linkedin.com/in/…"),
  applyCoverLabel: tolerantString.default("Cover letter"),
  applyCoverPlaceholder: tolerantString.default(
    "Tell us why you're a great fit for this role…",
  ),
  applyResumeLabel: tolerantString.default("Resume"),
  applySubmitLabel: tolerantString.default("Submit application"),
  applySuccessTitle: tolerantString.default("Application submitted"),
  applySuccessBody: tolerantString.default(
    "Thank you for applying. We review every application personally and will be in touch if there's a good fit.",
  ),
});

export const contactPageSectionsSchema = z.object({
  hero: z
    .object({
      eyebrow: tolerantStringDefault("Contact"),
      headline: tolerantStringDefault("Let's talk about what you want to grow"),
      subtext: tolerantStringDefault(
        "Share a bit about your business and goals. We reply within one business day.",
      ),
    })
    .default({
      eyebrow: "Contact",
      headline: "Let's talk about what you want to grow",
      subtext:
        "Share a bit about your business and goals. We reply within one business day.",
    }),
  sidebarEmail: tolerantString.default("info@kavcomexpert.com"),
  sidebarTitle: tolerantString.default("Prefer email?"),
  sidebarBody: tolerantString.default(
    "Use the form, or reach out directly and we will route it to Sid.",
  ),
  formTitle: tolerantString.default("Send a message"),
  formSubtitle: tolerantString.default(
    "Tell us what you are working on. We reply within one business day.",
  ),
  formNameLabel: tolerantString.default("Name"),
  formEmailLabel: tolerantString.default("Work email"),
  formCompanyLabel: tolerantString.default("Company"),
  formPhoneLabel: tolerantString.default("Phone"),
  formWebsiteLabel: tolerantString.default("Website"),
  formServiceLabel: tolerantString.default("What do you need help with?"),
  formBudgetLabel: tolerantString.default("Approximate budget"),
  formMessageLabel: tolerantString.default("How can we help?"),
  formMessagePlaceholder: tolerantString.default(
    "A short note on your goals, timeline, or what is not working today.",
  ),
  formSubmitLabel: tolerantString.default("Send message"),
  formSuccessTitle: tolerantString.default("Message sent"),
  formSuccessBody: tolerantString.default(
    "Thanks for reaching out. Sid will get back to you within one business day, usually sooner.",
  ),
  formServiceOptions: z.array(tolerantString).default([
    "Website design / development",
    "E-commerce (Shopify, WooCommerce, Magento)",
    "SEO / AI SEO",
    "Google Ads",
    "Social media / paid social",
    "App development",
    "Virtual assistant",
    "Not sure yet",
    "Something else",
  ]),
  formBudgetOptions: z.array(tolerantString).default([
    "Under $2,000",
    "$2,000 to $5,000",
    "$5,000 to $10,000",
    "$10,000 to $25,000",
    "$25,000+",
    "Not sure yet",
  ]),
  faqEyebrow: tolerantString.default("BEFORE YOU REACH OUT"),
  faqHeadline: tolerantString.default(
    "Answers to what you're probably wondering",
  ),
  faqDescription: tolerantString.default(
    "Everything people usually ask before working with us. If yours isn't here, the form above is the fastest way to ask.",
  ),
  faqs: z.array(faqItemSchema).default([
    {
      question: "What happens after I fill out the contact form?",
      answer:
        "Sid will personally get back to you within one business day, usually sooner. No automated replies, no being passed around a sales team. We will ask a few questions about your business and goals, and if it makes sense, set up a free strategy call.",
    },
    {
      question: "Is the strategy call really free? What's the catch?",
      answer:
        "Yes, genuinely free, and there is no catch. It is 20 to 30 minutes where we talk through your situation and give you honest advice, even if that advice is that you do not need us yet. We would rather earn your trust than pressure you into a contract.",
    },
    {
      question: "How much do your services cost?",
      answer:
        "It depends on the scope, and we will not pretend otherwise. A simple website costs far less than a full e-commerce build with ongoing marketing. What we promise is a clear, itemized quote before any work starts, with no hidden fees appearing later. Tell us your budget and we will tell you honestly what is achievable within it.",
    },
    {
      question: "How long does a typical project take?",
      answer:
        "Most websites go live in 3 to 6 weeks. E-commerce stores usually take 4 to 8 weeks depending on complexity. Marketing campaigns start showing early signals within the first month, with meaningful results by month three. You get a realistic timeline upfront, and we stick to it.",
    },
    {
      question: "Do you work with businesses outside India?",
      answer:
        "Yes, most of our clients are in the US, UK, and Canada. We are used to working across time zones and schedule calls at times that work for you, not just for us.",
    },
    {
      question: "Will I actually own my website?",
      answer:
        "Completely. The domain, the hosting, the code, the content, all of it belongs to you. If we ever part ways, you take everything with you. No hostage situations, ever.",
    },
    {
      question:
        "I already have a website. Can you fix or improve it instead of rebuilding?",
      answer:
        "Often, yes. Sometimes a site needs speed fixes, better SEO, or a design refresh rather than starting over. We will audit what you have and tell you straight whether it is worth improving or rebuilding. Rebuilding is not always the answer, and we will not sell it to you when it is not.",
    },
    {
      question: "What if I do not know exactly what I need?",
      answer:
        'That is completely normal, and honestly, most clients start there. You do not need to arrive with a plan. Tell us the problem, like "we are not getting enough customers" or "our site feels outdated," and figuring out the right solution is our job, not yours.',
    },
  ]),
});

export const blogPageSectionsSchema = z.object({
  heroEyebrow: tolerantStringDefault("Kavcom Journal"),
  heroHeadline: tolerantStringDefault(
    "Learn what actually grows a business online",
  ),
  heroSubtext: tolerantStringDefault(
    "Straightforward guides on websites, SEO, e-commerce and marketing, written from real client work.",
  ),
  searchLabel: tolerantStringDefault("Search articles"),
  searchPlaceholder: tolerantStringDefault(
    "Search articles by title or topic…",
  ),
  searchButton: tolerantStringDefault("Search"),
  allCategoryLabel: tolerantStringDefault("All"),
  newsletterEyebrow: tolerantString.default("Newsletter"),
  newsletterHeadline: tolerantString.default(
    "Get the next playbook before it hits the blog",
  ),
  newsletterBody: tolerantString.default(
    "Short, practical notes on websites, SEO, and paid growth, written for operators who ship.",
  ),
  newsletterPerk1: tolerantString.default("New articles in your inbox"),
  newsletterPerk2: tolerantString.default("SEO & growth playbooks"),
  newsletterPerk3: tolerantString.default("No spam. Unsubscribe anytime"),
  newsletterButton: tolerantString.default("Subscribe"),
  newsletterSuccess: tolerantString.default("You're on the list"),
});

const DEFAULT_HOME_FAQS = [
  {
    question: "Can Kavcom Expert help with website redesigns?",
    answer:
      "Yes, we specialize in website redesigns that improve user experience, modernize design, and enhance performance. Our redesign process includes content auditing, SEO preservation planning, design concept development, and phased migration to minimize disruption. All existing SEO value transfers to the new design through proper 301 redirects and URL structure maintenance.",
  },
  {
    question: "Do you offer monthly retainer services?",
    answer:
      "Yes, we provide flexible retainer options for ongoing development, maintenance, and marketing. Monthly retainers include allocated hours for updates, technical support, content changes, security monitoring, and strategic consulting. Retainer clients receive priority support and discounted hourly rates for work exceeding monthly allocations.",
  },
  {
    question: "What are your pricing models?",
    answer:
      "Our pricing is flexible and depends on the scope and scale of the project. We offer both one-time consulting fees and ongoing subscription plans. For detailed pricing, contact us for a customized quote.",
  },
  {
    question: "Can you integrate third-party services?",
    answer:
      "Yes, we integrate with hundreds of third-party services including CRMs (Salesforce, HubSpot), payment processors (Stripe, PayPal), email platforms (Mailchimp, SendGrid), analytics tools, inventory systems, and shipping carriers. We also build custom API integrations when needed.",
  },
  {
    question: "Do you provide training after website launch?",
    answer:
      "Yes, all projects include training for your team, video tutorials, written documentation, live training sessions, and ongoing support. Training covers content updates, product management, user administration, and basic troubleshooting.",
  },
  {
    question: "Can you help with domain and hosting setup?",
    answer:
      "Yes, we provide full hosting setup services including domain registration or transfer, DNS configuration, SSL certificate installation, email setup, and server optimization. We can manage hosting on your behalf or work with your preferred provider.",
  },
];

const DEFAULT_HOME_WHY_REASONS = [
  {
    title: "End-to-End Expertise",
    body: "From initial strategy and development to marketing and ongoing support, we're your single partner for all digital needs. No juggling multiple vendors.",
  },
  {
    title: "Transparent Communication",
    body: "You'll always know what's happening with your project. Regular updates, clear timelines, and a dedicated point of contact ensure alignment every step of the way.",
  },
  {
    title: "Results-Focused Approach",
    body: "We measure success by your success. Every solution is built with clear KPIs and business objectives in mind, not just technical deliverables.",
  },
];

const DEFAULT_HOME_PROCESS_STEPS = [
  {
    number: "01",
    name: "Discover",
    description:
      "We start by listening. Before anyone talks design or code, we want to understand your business, who your customers are, what your competitors are doing, and what has and hasn't worked for you before.",
  },
  {
    number: "02",
    name: "Strategize",
    description:
      "Then we put a plan on paper. Clear goals, realistic timelines, and what success actually looks like in numbers, agreed together before any work begins.",
  },
  {
    number: "03",
    name: "Design",
    description:
      "This is where your brand takes shape. We design around your customers and how they actually behave, not around what looks good in a portfolio.",
  },
  {
    number: "04",
    name: "Build",
    description:
      "Our developers bring the designs to life with clean, fast code built to grow with you. You get regular updates and working previews along the way.",
  },
  {
    number: "05",
    name: "Grow",
    description:
      "We stay with you long after launch to make sure your new site is working as hard as you are.",
  },
];

const DEFAULT_HOME_BENEFITS = [
  {
    title: "Innovative solutions for modern brands",
    body: "Cutting-edge approaches that keep your brand ahead of trends: from AI-powered SEO to headless commerce architectures, we bring tomorrow's tools to today's challenges.",
  },
  {
    title: "Expert team with proven results",
    body: "Certified specialists across every discipline (development, design, SEO, and paid media) with a track record of delivering measurable growth.",
  },
  {
    title: "Customized strategies for your goals",
    body: "No templates, no one-size-fits-all. Every engagement starts with your business objectives and ends with a plan built specifically around them.",
  },
  {
    title: "Dedicated support, every step",
    body: "A responsive team that treats your project like its own: transparent reporting, proactive communication, and long-term partnership beyond launch day.",
  },
];

const DEFAULT_HOME_TICKER = [
  "WordPress",
  "Shopify",
  "Magento",
  "WooCommerce",
  "SEO & AI SEO",
  "Google Ads",
  "Social Media",
  "Video Editing",
  "UI/UX",
  "Virtual Assistant",
  "Digital Marketing",
  "iOS & Android",
];

const DEFAULT_HOME_ROTATING_WORDS = [
  "Digital Marketing",
  "WordPress",
  "Shopify",
  "WooCommerce",
  "Video Editing",
  "Branding",
  "UI/UX",
];

export const HOME_TECH_ICON_KEYS = [
  "WordPress",
  "Shopify",
  "Magento",
  "WooCommerce",
  "Google Ads",
  "Digital Marketing",
  "SEO & AI SEO",
  "UI/UX Design",
  "App Development",
] as const;

const DEFAULT_HOME_TECH_BADGES = [...HOME_TECH_ICON_KEYS];

const DEFAULT_HOME_TECH_BADGE_ITEMS = DEFAULT_HOME_TECH_BADGES.map((label) => ({
  label,
  iconKey: label,
}));

const techBadgeItemSchema = z.object({
  label: tolerantString,
  iconKey: tolerantString,
});

const DEFAULT_HOME_LOGOS = [
  { name: "Boostfunders", src: "/logos/boostfunders.png" },
  { name: "Bertram Financial", src: "/logos/bertram-financial.webp" },
  { name: "CGF", src: "/logos/cgf.webp" },
  { name: "Klimbim", src: "/logos/klimbim.png" },
  { name: "Lascada", src: "/logos/lascada.webp" },
  { name: "Client 01", src: "/logos/client-01.png" },
  { name: "Client 02", src: "/logos/client-02.png" },
  { name: "Client 03", src: "/logos/client-03.png" },
  { name: "Client 04", src: "/logos/client-04.png" },
  { name: "Client 05", src: "/logos/client-05.png" },
  { name: "Client 06", src: "/logos/client-06.png" },
  { name: "Client 07", src: "/logos/client-07.png" },
  { name: "Client 08", src: "/logos/client-08.png" },
  { name: "Client 09", src: "/logos/client-09.png" },
  { name: "Client 10", src: "/logos/client-10.png" },
  { name: "Client 11", src: "/logos/client-11.png" },
  { name: "Client 12", src: "/logos/client-12.png" },
  { name: "Client 13", src: "/logos/client-13.png" },
  { name: "Client 14", src: "/logos/client-14.png" },
  { name: "Client 15", src: "/logos/client-15.png" },
  { name: "Client 16", src: "/logos/client-16.png" },
  { name: "Client 17", src: "/logos/client-17.png" },
  { name: "Client 18", src: "/logos/client-18.png" },
  { name: "Client 19", src: "/logos/client-19.png" },
  { name: "Client 20", src: "/logos/client-20.png" },
  { name: "Client 21", src: "/logos/client-21.png" },
  { name: "Client 22", src: "/logos/client-22.png" },
  { name: "Client 23", src: "/logos/client-23.png" },
  { name: "Client 24", src: "/logos/client-24.png" },
  { name: "Client 25", src: "/logos/client-25.png" },
  { name: "Client 26", src: "/logos/client-26.png" },
  { name: "Client 27", src: "/logos/client-27.png" },
  { name: "Client 28", src: "/logos/client-28.png" },
  { name: "Client 29", src: "/logos/client-29.png" },
  { name: "Client 30", src: "/logos/client-30.png" },
  { name: "Client 31", src: "/logos/client-31.png" },
  { name: "Client 32", src: "/logos/client-32.png" },
  { name: "Client 33", src: "/logos/client-33.png" },
  { name: "Client 34", src: "/logos/client-34.png" },
  { name: "Client 35", src: "/logos/client-35.png" },
  { name: "Client 36", src: "/logos/client-36.png" },
  { name: "Client 37", src: "/logos/client-37.png" },
  { name: "Client 38", src: "/logos/client-38.png" },
  { name: "Client A", src: "/logos/client-png-a.png" },
  { name: "Client B", src: "/logos/client-png-b.png" },
];

const DEFAULT_DEV_CARDS = [
  {
    slug: "wordpress-development",
    name: "WordPress Development",
    href: "/services/wordpress-development",
    description:
      "Custom WordPress websites with powerful functionality, SEO optimization, and intuitive content management.",
  },
  {
    slug: "shopify-development",
    name: "Shopify Development",
    href: "/services/shopify-development",
    description:
      "Scalable Shopify stores with custom themes, app integrations, and mobile-first performance that maximizes revenue.",
  },
  {
    slug: "magento-development",
    name: "Magento Development",
    href: "/services/magento-development",
    description:
      "Enterprise-grade Magento commerce with complex catalogs, custom modules, and integrations built to scale.",
  },
  {
    slug: "woocommerce-development",
    name: "WooCommerce Development",
    href: "/services/woocommerce-development",
    description:
      "High-converting WooCommerce stores with seamless payments, inventory management, and optimized checkout.",
  },
  {
    slug: "android-app-development",
    name: "Android App Development",
    href: "/services/android-app-development",
    description:
      "Native Android applications engineered for performance, Play Store readiness, and real business outcomes.",
  },
  {
    slug: "ios-app-development",
    name: "iOS App Development",
    href: "/services/ios-app-development",
    description:
      "Polished iOS apps with fluid interfaces and App Store optimization, built for Apple's ecosystem.",
  },
];

const DEFAULT_GROWTH_CARDS = [
  {
    slug: "digital-marketing",
    name: "Digital Marketing",
    href: "/services/digital-marketing",
    description:
      "Integrated, data-driven campaigns across search, social, and email that generate qualified leads and measurable ROI.",
  },
  {
    slug: "seo-ai-optimization",
    name: "SEO & AI SEO Services",
    href: "/services/digital-marketing/seo-ai-optimization",
    description:
      "Organic rankings, technical performance, and AI-search visibility, content strategies that dominate results pages.",
  },
  {
    slug: "google-ads",
    name: "Google Ads",
    href: "/services/digital-marketing/google-ads",
    description:
      "ROAS-focused search, display, and shopping campaigns with smart bidding, tracking, and continuous optimization.",
  },
  {
    slug: "social-media-marketing",
    name: "Social Media Marketing",
    href: "/services/digital-marketing/social-media-marketing",
    description:
      "Engaging content, community management, and paid social that turns followers into customers.",
  },
  {
    slug: "video-editing",
    name: "Video Editing",
    href: "/services/digital-marketing/video-editing",
    description:
      "Professional video production with color grading, motion graphics, and sound design for maximum engagement.",
  },
  {
    slug: "virtual-assistant",
    name: "Virtual Assistant",
    href: "/services/digital-marketing/virtual-assistant",
    description:
      "Dedicated support for admin, customer service, content management, and scheduling, so you can focus on growth.",
  },
];

const homePageSectionsObjectSchema = z.object({
  faqs: z.array(faqItemSchema).default(DEFAULT_HOME_FAQS),
  whyReasons: z
    .array(
      z.object({
        title: tolerantString,
        body: tolerantString,
      }),
    )
    .default(DEFAULT_HOME_WHY_REASONS),
  processSteps: z
    .array(
      z.object({
        number: tolerantString,
        name: tolerantString,
        description: tolerantString,
      }),
    )
    .default(DEFAULT_HOME_PROCESS_STEPS),
  benefits: z
    .array(
      z.object({
        title: tolerantString,
        body: tolerantString,
      }),
    )
    .default(DEFAULT_HOME_BENEFITS),
  tickerItems: z.array(tolerantString).default(DEFAULT_HOME_TICKER),
  rotatingWords: z.array(tolerantString).default(DEFAULT_HOME_ROTATING_WORDS),
  /** @deprecated prefer techBadges; kept for older saved pageSections */
  techBadgeLabels: z.array(tolerantString).default(DEFAULT_HOME_TECH_BADGES),
  techBadges: z
    .array(techBadgeItemSchema)
    .default(DEFAULT_HOME_TECH_BADGE_ITEMS),
  clientLogos: z.array(logoItemSchema).default(DEFAULT_HOME_LOGOS),
  devServiceCards: z
    .array(serviceCardItemSchema)
    .default(DEFAULT_DEV_CARDS),
  growthServiceCards: z
    .array(serviceCardItemSchema)
    .default(DEFAULT_GROWTH_CARDS),
  videoTestimonials: z
    .array(
      z.object({
        id: tolerantString,
        name: tolerantString,
        company: tolerantString,
        videoSrc: tolerantString,
        youtubeId: tolerantString,
        posterSrc: tolerantString,
      }),
    )
    .default([
      {
        id: "Phillips-Business-Group",
        name: "Tiffany Phillips",
        company: "Phillips Business Group",
        videoSrc: "",
        youtubeId: "q0gnm8rqBH4",
        posterSrc: "",
      },
      {
        id: "Grace-Realty-&-Property-Management",
        name: "Beverly Grace",
        company: "Grace Realty & Property Mgmt",
        videoSrc: "",
        youtubeId: "bnMqf2r1yQ0",
        posterSrc: "",
      },
      {
        id: "Perfunnle-Inc",
        name: "Kristen Allen Pulanco",
        company: "Perfunnle Inc.",
        videoSrc: "",
        youtubeId: "nDNhIcfkLQY",
        posterSrc: "",
      },
      {
        id: "Headless-Chicken-Growth-Group",
        name: "Dane Richardshon",
        company: "Headless Chicken Growth Group",
        videoSrc: "",
        youtubeId: "wv1C4oUA7pQ",
        posterSrc: "",
      },
    ]),
});

/** Homepage structured lists. Header copy stays in content blocks. */
export const homePageSectionsSchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== "object") return raw;
  const record = { ...(raw as Record<string, unknown>) };
  const badges = Array.isArray(record.techBadges) ? record.techBadges : [];
  const labels = Array.isArray(record.techBadgeLabels)
    ? record.techBadgeLabels
    : [];

  if (badges.length === 0 && labels.length > 0) {
    record.techBadges = labels.map((label) => ({
      label: typeof label === "string" ? label : "",
      iconKey: typeof label === "string" ? label : "",
    }));
  } else if (badges.length > 0) {
    record.techBadgeLabels = badges.map((item) => {
      if (item && typeof item === "object" && "label" in item) {
        const label = (item as { label: unknown }).label;
        return typeof label === "string" ? label : "";
      }
      return "";
    });
  }

  return record;
}, homePageSectionsObjectSchema);

const DEFAULT_ABOUT_MISSION_ITEMS = [
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
];

const DEFAULT_ABOUT_WHO_HIGHLIGHTS = [
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
];

const DEFAULT_ABOUT_STATS = [
  { metric: "8+", label: "Years of experience" },
  { metric: "200+", label: "Projects completed" },
  { metric: "25+", label: "Team members" },
  { metric: "98%", label: "Client satisfaction" },
];

const DEFAULT_ABOUT_WHY_REASONS = [
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
];

const DEFAULT_ABOUT_FAQS = [
  {
    question: "What is Kavcom Expert?",
    answer:
      "Kavcom Expert is a full-service digital solutions company that helps businesses grow online through website development, app development, custom solutions, digital marketing, virtual assistant services, and performance-driven strategies.",
  },
  {
    question: "Who do you work with?",
    answer:
      "We work with startups, small businesses, agencies, and growing enterprises across different industries, mainly in the US, Canada, and international markets.",
  },
  {
    question: "What services do you specialize in?",
    answer:
      "Our core services include website design and development (WordPress, Shopify, Magento, WooCommerce, and custom builds), SEO and AI SEO, iOS and Android app development, social media marketing, paid advertising, virtual assistant services, and ongoing website maintenance.",
  },
  {
    question: "What makes Kavcom Expert different from other agencies?",
    answer:
      "We focus on practical results, transparent communication, and long-term partnerships. Our team combines technical expertise with business understanding, so we do not just build things. We build solutions that convert.",
  },
];

export const aboutPageSectionsSchema = z.object({
  missionEyebrow: tolerantStringDefault("What drives us"),
  missionHeadline: tolerantStringDefault("Mission, vision, and values"),
  missionItems: z
    .array(
      z.object({
        eyebrow: tolerantString,
        title: tolerantString,
        body: tolerantString,
      }),
    )
    .default(DEFAULT_ABOUT_MISSION_ITEMS),
  whoEyebrow: tolerantStringDefault("Who we are"),
  whoHeadlineLead: tolerantStringDefault("Experts in"),
  whoHeadlineAccent: tolerantStringDefault("digital brand innovation"),
  whoBody: tolerantStringDefault(
    "We transform brands with digital strategy, creative craft, and reliable engineering. From WordPress and Shopify to custom apps, SEO, paid media, and virtual assistance, we operate as one team.",
  ),
  whoTags: z
    .array(tolerantString)
    .default(["Web", "Apps", "SEO", "Ads", "Design", "VA"]),
  whoHighlights: z
    .array(
      z.object({
        title: tolerantString,
        body: tolerantString,
      }),
    )
    .default(DEFAULT_ABOUT_WHO_HIGHLIGHTS),
  whoStats: z
    .array(
      z.object({
        metric: tolerantString,
        label: tolerantString,
      }),
    )
    .default(DEFAULT_ABOUT_STATS),
  whyEyebrow: tolerantStringDefault("Why choose us"),
  whyHeadlineLead: tolerantStringDefault("Built for"),
  whyHeadlineAccent: tolerantStringDefault("long-term growth"),
  whyBody: tolerantStringDefault(
    "Quality, innovation, and client success make us the preferred digital partner for businesses worldwide.",
  ),
  whyReasons: z
    .array(
      z.object({
        index: tolerantString,
        title: tolerantString,
        body: tolerantString,
      }),
    )
    .default(DEFAULT_ABOUT_WHY_REASONS),
  faqEyebrow: tolerantStringDefault("Have any questions?"),
  faqHeadline: tolerantStringDefault("Let us address your questions today!"),
  faqs: z.array(faqItemSchema).default(DEFAULT_ABOUT_FAQS),
  socialProofEyebrow: tolerantStringDefault("Client stories"),
  socialProofHeadline: tolerantStringDefault(
    "What clients say about working with us",
  ),
});

const DEFAULT_SERVICES_FAQS = [
  {
    question: "What services does Kavcom Expert provide?",
    answer:
      "Kavcom Expert offers complete digital solutions including website design & development (WordPress, Shopify, custom), digital marketing, SEO, social media management, virtual assistant services, UI/UX design, website maintenance, and performance optimization.",
  },
  {
    question: "Do you work with clients outside India?",
    answer:
      "Yes. We work with clients globally, especially in the USA and Canada, providing remote services with flexible communication and support across different time zones.",
  },
  {
    question: "How long does it take to complete a website project?",
    answer:
      "Project timelines depend on the scope and complexity. A basic website usually takes 7-14 days, while larger or custom projects may take 3-6 weeks.",
  },
  {
    question: "Do you offer customized service packages?",
    answer:
      "Absolutely. We understand every business has unique needs, so we create custom packages based on your goals, budget, and requirements.",
  },
  {
    question: "Can you redesign or improve my existing website?",
    answer:
      "Yes. We provide complete website redesigns, speed optimization, SEO improvements, UI/UX enhancements, security updates, and performance tuning for existing websites.",
  },
  {
    question: "What platforms and technologies do you specialize in?",
    answer:
      "We specialize in WordPress, Shopify, HTML/CSS/JavaScript, PHP, React, and modern marketing tools such as Google Analytics, Search Console, CRM integrations, and automation platforms.",
  },
  {
    question: "Do you provide ongoing support and maintenance?",
    answer:
      "Yes. We offer monthly maintenance and support plans that include updates, backups, security monitoring, performance optimization, and technical assistance.",
  },
  {
    question: "How do your digital marketing services help grow my business?",
    answer:
      "Our digital marketing services focus on increasing visibility, traffic, and conversions through SEO, content marketing, social media management, paid ads, email marketing, and conversion optimization strategies.",
  },
  {
    question: "Are your virtual assistants trained for specific tasks?",
    answer:
      "Yes. Our virtual assistants are trained for tasks such as customer support, lead generation, CRM management, data entry, appointment scheduling, social media handling, and administrative support.",
  },
  {
    question: "How do I get started with Kavcom Expert?",
    answer:
      "You can contact us through our website, book a consultation call, or send us your requirements. Our team will analyze your needs and propose the best solution for your business.",
  },
];

const DEFAULT_SERVICES_HERO_NAV = [
  { label: "Web & app development", href: "#web-development" },
  { label: "Digital marketing", href: "#digital-marketing" },
  { label: "Add-on services", href: "#add-on-services" },
];

const DEFAULT_TECH_CATEGORIES = [
  {
    title: "Web & app development",
    description:
      "Platforms, languages, and frameworks powering our websites, stores, and mobile apps.",
    logos: [
      { name: "WordPress", src: "/tech/wordpress.svg", darkSrc: "", wide: false },
      { name: "Shopify", src: "/tech/shopify.svg", darkSrc: "", wide: false },
      { name: "Magento", src: "/tech/magento.svg", darkSrc: "", wide: false },
      { name: "WooCommerce", src: "/tech/woocommerce.svg", darkSrc: "", wide: false },
      { name: "PHP", src: "/tech/php.svg", darkSrc: "", wide: false },
      { name: "React", src: "/tech/react.svg", darkSrc: "", wide: false },
      { name: "Node.js", src: "/tech/nodejs.svg", darkSrc: "", wide: false },
      { name: "Swift", src: "/tech/swift.svg", darkSrc: "", wide: false },
      { name: "Kotlin", src: "/tech/kotlin.svg", darkSrc: "", wide: false },
    ],
  },
  {
    title: "Marketing, design & content",
    description:
      "The tools behind our campaigns, analytics, creative, and content production.",
    logos: [
      { name: "Google Ads", src: "/tech/google-ads.svg", darkSrc: "", wide: false },
      { name: "Google Analytics", src: "/tech/google-analytics.svg", darkSrc: "", wide: false },
      { name: "Meta", src: "/tech/meta.svg", darkSrc: "", wide: false },
      { name: "Semrush", src: "/tech/semrush.svg", darkSrc: "", wide: false },
      { name: "HubSpot", src: "/tech/hubspot.svg", darkSrc: "", wide: false },
      { name: "Figma", src: "/tech/figma.svg", darkSrc: "", wide: false },
      { name: "YouTube", src: "/tech/youtube.svg", darkSrc: "", wide: false },
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
      { name: "Cloudflare", src: "/tech/cloudflare.svg", darkSrc: "", wide: false },
      { name: "Google Cloud", src: "/tech/google-cloud.svg", darkSrc: "", wide: false },
      { name: "Docker", src: "/tech/docker.svg", darkSrc: "", wide: false },
      { name: "Stripe", src: "/tech/stripe.svg", darkSrc: "", wide: false },
      {
        name: "PayPal",
        src: "/tech/paypal.svg",
        darkSrc: "/tech/paypal-dark.svg",
        wide: false,
      },
      {
        name: "GitHub",
        src: "/tech/github.svg",
        darkSrc: "/tech/github-dark.svg",
        wide: false,
      },
    ],
  },
];

/** Services index structured sections (FAQ + tech stack + hero nav). */
export const servicesPageSectionsSchema = z.object({
  faqEyebrow: tolerantStringDefault("FAQs"),
  faqHeadline: tolerantStringDefault("Frequently asked questions"),
  faqDescription: tolerantStringDefault(
    "Everything you need to know about working with us. Can't find your answer here?",
  ),
  faqs: z.array(faqItemSchema).default(DEFAULT_SERVICES_FAQS),
  faqCta: linkButtonZodField(
    linkButton("Talk to our team", "/contact-us"),
  ),
  techEyebrow: tolerantStringDefault("Our tech stack"),
  techHeadline: tolerantStringDefault("The technologies behind the results"),
  techBody: tolerantStringDefault(
    "We work with proven, industry-standard platforms and tools, so your project is built on technology that lasts.",
  ),
  techCategories: z.array(techCategorySchema).default(DEFAULT_TECH_CATEGORIES),
  heroNavPills: z
    .array(
      z.object({
        label: tolerantString,
        href: tolerantString,
      }),
    )
    .default(DEFAULT_SERVICES_HERO_NAV),
});

export type PageHero = z.infer<typeof pageHeroSchema>;

export type ContactPageSections = z.infer<typeof contactPageSectionsSchema>;
export type WorkPageSections = z.infer<typeof workPageSectionsSchema>;
export type CareersPageSections = z.infer<typeof careersPageSectionsSchema>;
export type BlogPageSections = z.infer<typeof blogPageSectionsSchema>;
export type HomePageSections = z.infer<typeof homePageSectionsSchema>;
export type AboutPageSections = z.infer<typeof aboutPageSectionsSchema>;
export type ServicesPageSections = z.infer<typeof servicesPageSectionsSchema>;

export const PAGE_CONTENT_BLOCK_PREFIXES: Record<string, string[]> = {
  home: ["home."],
  "about-us": ["about."],
  services: ["services."],
  blog: ["blog."],
};

/** System page slugs that use page-section schemas (not service marketing blocks). */
export const SYSTEM_SECTION_PAGE_SLUGS = [
  "home",
  "about-us",
  "contact-us",
  "work",
  "careers",
  "blog",
  "services",
] as const;

export type SystemSectionPageSlug = (typeof SYSTEM_SECTION_PAGE_SLUGS)[number];

export function isSystemSectionPage(slug: string): slug is SystemSectionPageSlug {
  return (SYSTEM_SECTION_PAGE_SLUGS as readonly string[]).includes(slug);
}

// Stored page_sections can contain legacy shapes (e.g. null where an array is
// expected), which would make .parse throw and 500 the admin editor. Fall back
// to schema defaults instead of crashing.
function parseWithFallback<Schema extends z.ZodTypeAny>(
  schema: Schema,
  value: unknown,
): z.infer<Schema> {
  const result = schema.safeParse(value ?? {});
  return result.success ? result.data : schema.parse({});
}

export function parsePageSectionsForSlug(
  slug: string,
  value: unknown,
):
  | ContactPageSections
  | WorkPageSections
  | CareersPageSections
  | BlogPageSections
  | HomePageSections
  | AboutPageSections
  | ServicesPageSections
  | null {
  switch (slug) {
    case "contact-us":
      return parseWithFallback(contactPageSectionsSchema, value);
    case "work":
      return parseWithFallback(workPageSectionsSchema, value);
    case "careers":
      return parseWithFallback(careersPageSectionsSchema, value);
    case "blog":
      return parseWithFallback(blogPageSectionsSchema, value);
    case "home":
      return parseWithFallback(homePageSectionsSchema, value);
    case "about-us":
      return parseWithFallback(aboutPageSectionsSchema, value);
    case "services":
      return parseWithFallback(servicesPageSectionsSchema, value);
    default:
      return null;
  }
}

export function emptyPageSectionsForSlug(slug: string): unknown {
  switch (slug) {
    case "contact-us":
      return contactPageSectionsSchema.parse({});
    case "work":
      return workPageSectionsSchema.parse({});
    case "careers":
      return careersPageSectionsSchema.parse({});
    case "blog":
      return blogPageSectionsSchema.parse({});
    case "home":
      return homePageSectionsSchema.parse({});
    case "about-us":
      return aboutPageSectionsSchema.parse({});
    case "services":
      return servicesPageSectionsSchema.parse({});
    default:
      return {};
  }
}

export function contentBlockPrefixForPage(slug: string): string[] | null {
  return PAGE_CONTENT_BLOCK_PREFIXES[slug] ?? null;
}
