/**
 * Single source for Houston CPA landing page copy, pricing, and placeholders.
 * Replace PLACEHOLDER_* values when you have stronger proof.
 */

export const HOUSTON_CPA_PATH = "/cpa-marketing-agency-houston";

export const BOOKING_URL =
  "https://calendar.app.google/N1gUALXU334bbxzf9?utm_source=kavcomexpert&utm_medium=landing&utm_campaign=houston_cpa_marketing&utm_content=book_fit_call";

export const PHONE_DISPLAY = "+1 302-703-0833";
export const PHONE_E164 = "+13027030833";

export const PAGE_TITLE = "CPA Marketing Agency Houston | Kavcom Expert";
export const PAGE_DESCRIPTION =
  "Marketing and back office support for Houston CPA firms. Websites, local SEO, AEO, social, and VA support. Book a free 20 minute fit call.";

/** Trust bar. Update when you have audited numbers. */
export const TRUST_STATS = {
  yearsOperating: "9",
  yearsLabel: "years operating",
  clientsServed: "120+",
  clientsLabel: "clients across US, UK & Canada",
  responseTime: "< 4 hrs",
  responseLabel: "average response time",
  timezoneOverlap: "6 hrs",
  timezoneLabel: "daily overlap with Central Time",
} as const;

export const SERVICE_OPTIONS = [
  "Website design and development",
  "Local SEO and Google Business Profile",
  "AEO and GEO optimization",
  "Content marketing",
  "Social media management",
  "Video editing and short form",
  "Virtual assistant support",
  "Email marketing and newsletters",
] as const;

export const FIRM_SIZE_OPTIONS = [
  { value: "solo", label: "Solo" },
  { value: "2-5", label: "2 to 5" },
  { value: "6-15", label: "6 to 15" },
  { value: "16+", label: "16 plus" },
] as const;

export const SPEND_OPTIONS = [
  { value: "under-500", label: "Under $500 / month" },
  { value: "500-1500", label: "$500 to $1,500 / month" },
  { value: "1500-3000", label: "$1,500 to $3,000 / month" },
  { value: "3000-plus", label: "$3,000+ / month" },
  { value: "none", label: "Not spending yet" },
] as const;

export const PRICING = {
  foundation: {
    name: "Foundation",
    monthly: 850,
    blurb:
      "For solo CPAs and firms under 5 people who need to stop being invisible.",
    features: [
      "Website maintenance, updates, backups, uptime monitoring",
      "Google Business Profile optimization and monthly posts",
      "Local SEO foundation, on page fixes and citation cleanup",
      "8 social posts per month across 2 platforms",
      "Monthly performance report",
      "Email support, 24 hour response",
    ],
  },
  growth: {
    name: "Growth",
    monthly: 1650,
    popular: true,
    blurb: "Everything in Foundation, plus search and content that compounds.",
    features: [
      "Full local SEO campaign, Houston metro keyword targeting",
      "AEO and GEO optimization, FAQ schema and answer engine formatting",
      "2 SEO blog posts per month, written for search and for AI citation",
      "16 social posts per month across 3 platforms",
      "4 short form videos per month, edited and captioned",
      "Landing page builds, one per quarter",
      "Monthly strategy call",
      "Priority support, 8 hour response",
    ],
  },
  scale: {
    name: "Scale",
    monthly: 2800,
    blurb: "Everything in Growth, plus dedicated VA capacity and fuller media.",
    features: [
      "Dedicated virtual assistant, 40 hours per month, client intake and document chasing",
      "4 SEO blog posts per month",
      "Daily social management across 4 platforms",
      "8 videos per month including long form YouTube editing",
      "Email marketing, campaigns and automated sequences",
      "Conversion rate optimization and A/B testing",
      "Bi-weekly strategy calls",
      "Dedicated account manager, same day response",
    ],
  },
} as const;

export const QUARTERLY_DISCOUNT = 0.1;

export function quarterlyPrice(monthly: number): number {
  return Math.round(monthly * 3 * (1 - QUARTERLY_DISCOUNT));
}

export function quarterlyEffectiveMonthly(monthly: number): number {
  return Math.round(monthly * (1 - QUARTERLY_DISCOUNT));
}

export const SERVICES_GRID = [
  {
    title: "Website design and development",
    body: "WordPress, WooCommerce, and Next.js builds that load fast, look current, and convert inquiry forms instead of collecting dust.",
  },
  {
    title: "Local SEO for Houston",
    body: "Google Business Profile optimization and metro keyword work so Houston prospects find you before they call a competitor.",
  },
  {
    title: "AEO and GEO",
    body: "AEO, or answer engine optimization, structures your content and schema so ChatGPT, Perplexity, and AI Overviews can cite your firm.",
  },
  {
    title: "Content marketing",
    body: "Blog and tax season editorial calendars that answer the questions your ideal clients already type into Google.",
  },
  {
    title: "Social media management",
    body: "LinkedIn, Facebook, and Instagram posting that keeps the firm visible between busy seasons, without you writing every caption.",
  },
  {
    title: "Video editing and short form",
    body: "YouTube and Reels production from raw clips, edited and captioned so partners stay on camera while we handle the cut.",
  },
  {
    title: "Virtual assistant support",
    body: "Client intake, document chasing, inbox, and calendar management so your front desk stops drowning in follow ups.",
  },
  {
    title: "Email marketing and newsletters",
    body: "Retention and reactivation campaigns that keep past clients warm and pull dormant files back onto the calendar.",
  },
] as const;

export const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Fit call",
    body: "Twenty minutes. We map what is broken. No payment is taken before this call.",
  },
  {
    step: "02",
    title: "Custom scope",
    body: "We recommend a package and the exact deliverables inside it, written plainly.",
  },
  {
    step: "03",
    title: "Approve and onboard",
    body: "You approve. Kickoff within 48 hours with access checklists and a single owner.",
  },
  {
    step: "04",
    title: "Monthly delivery",
    body: "Reporting every month. One point of contact. No ticket queues.",
  },
] as const;

export const PAIN_POINTS = [
  {
    title: "The website still looks like 2016",
    body: "It was built once, never maintained, and does not rank for the services you actually sell in Houston. Prospects bounce before they book.",
  },
  {
    title: "Google Business Profile is half done",
    body: "Unclaimed, thin, or stuck on outdated hours and photos. Meanwhile firms across the Loop are winning the map pack with weekly posts.",
  },
  {
    title: "LinkedIn went quiet after tax season",
    body: "Partners meant to post. Then April hit. The feed is empty and warm referrals never see the firm thinking in public.",
  },
  {
    title: "Intake and document chasing eat the day",
    body: "The front desk is buried in missing W-2s, unsigned engagement letters, and calendar ping pong. Billable hours disappear into admin.",
  },
] as const;

export const COMPARISON_ROWS = [
  {
    label: "Monthly cost",
    kavcom: "From $850 / month, clear packages",
    inHouse: "Salary plus tools, often $4k to $8k+",
    agency: "Retainers vary; scopes often opaque",
  },
  {
    label: "Time to launch",
    kavcom: "Kickoff within 48 hours after approval",
    inHouse: "Hiring and ramp, usually months",
    agency: "Discovery and contracts, often weeks",
  },
  {
    label: "Breadth of services",
    kavcom: "Web, SEO, AEO, social, video, VA, email",
    inHouse: "Usually one specialty per hire",
    agency: "Often marketing only, VA separate",
  },
  {
    label: "Contract lock in",
    kavcom: "No long contracts. Cancel anytime.",
    inHouse: "Employment commitments",
    agency: "Common 6 to 12 month minimums",
  },
  {
    label: "Reporting",
    kavcom: "Monthly, one owner, plain English",
    inHouse: "Depends on who you hired",
    agency: "Dashboards vary by shop",
  },
] as const;

/**
 * Case snapshot using a real published client voice from the site.
 * Metric stays qualitative (no invented percentages).
 */
export const CASE_SNAPSHOT = {
  metric: "One owner. Clear ops.",
  metricHint: "Marketing + intake support, not five vendors",
  context:
    "Phillips Business Group works with Kavcom Expert on digital presence and day to day support so leadership can stay with clients instead of juggling agencies, freelancers, and admin follow ups.",
  attribution: "Tiffany Phillips, Phillips Business Group",
} as const;

export const FAQ_ITEMS = [
  {
    question: "How much does marketing cost for a CPA firm in Houston?",
    answer:
      "Most Houston CPA firms we scope land between $850 and $2,800 per month. Foundation covers visibility basics. Growth adds SEO content and video. Scale adds a dedicated virtual assistant. Custom scopes exist for multi partner firms.",
  },
  {
    question: "Do you work only with accounting firms?",
    answer:
      "No. Kavcom Expert serves many industries. This page is built for Houston CPA and accounting firms because their intake, seasonality, and compliance needs are specific. The same team also ships websites, SEO, and VA work for other professional services.",
  },
  {
    question: "How long until we see SEO results?",
    answer:
      "Local SEO usually shows movement in 60 to 90 days when the Google Business Profile and on page basics are fixed. Competitive Houston keywords take longer. We set expectations on the fit call so you are not guessing.",
  },
  {
    question: "Is there a contract or minimum term?",
    answer:
      "There is no long term lock in. You can cancel anytime. We ask for clear notice so deliverables wind down cleanly. No payment is taken before the fit call.",
  },
  {
    question: "Who actually does the work?",
    answer:
      "Specialists inside Kavcom Expert handle design, development, SEO, content, social, video, and VA tasks. You get one account owner. You are not bounced between anonymous ticket queues.",
  },
  {
    question: "How do you handle client confidentiality and data security?",
    answer:
      "We treat firm and client data as confidential by default. Access is limited to people on the engagement. We follow your preferred tools and retention rules, and we do not use client files for marketing examples without written approval.",
  },
  {
    question: "Can you work with our existing website?",
    answer:
      "Yes. Many Houston firms keep their current stack. We audit, fix, and improve what you have when that is the faster path. If the site cannot support SEO or conversions, we say so plainly and scope a rebuild.",
  },
  {
    question: "What is the difference between SEO and AEO or GEO?",
    answer:
      "SEO helps you rank in classic search results. AEO, or answer engine optimization, formats content so AI assistants can quote you. GEO focuses on geographic relevance for local queries. Houston CPA firms usually need all three working together.",
  },
  {
    question: "Do you offer virtual assistant support separately?",
    answer:
      "Yes. VA hours can sit inside Scale or as a custom add on. Typical work includes intake, document chasing, inbox triage, and calendar management. We scope hours on the fit call so coverage matches your season.",
  },
  {
    question: "How quickly can we start?",
    answer:
      "After you approve scope, kickoff is within 48 hours. Book a free 20 minute fit call first. We map priorities, recommend a package, and only then talk payment.",
  },
] as const;

export const INTERNAL_LINKS = [
  {
    href: "/services/seo-ai-optimization",
    label: "SEO and AI SEO services",
  },
  {
    href: "/services/virtual-assistant",
    label: "Virtual assistant support",
  },
  {
    href: "/services/social-media-marketing",
    label: "Social media marketing",
  },
] as const;
