import {
  servicePath,
  workIndexPath,
} from "@/lib/paths";

export type FlowChoice =
  | {
      id: string;
      label: string;
      next: string;
    }
  | {
      id: string;
      label: string;
      href: string;
    };

export type FlowNode =
  | {
      id: string;
      kind: "question";
      messages: string[];
      choices: FlowChoice[];
    }
  | {
      id: string;
      kind: "form";
      intro: string;
      includeMessage?: boolean;
      messagePlaceholder?: string;
    }
  | {
      id: string;
      kind: "success";
      messages: string[];
      choices: FlowChoice[];
    }
  | {
      id: string;
      kind: "fallback";
      messages: string[];
      next: string;
    };

export const FLOW_START = "greeting";
export const FLOW_FALLBACK = "fallback";
export const FLOW_SUCCESS = "success";

export const flowNodes: Record<string, FlowNode> = {
  greeting: {
    id: "greeting",
    kind: "question",
    messages: [
      "Hey! I'm the Kavcom assistant. Tell me what you're looking for and I'll point you in the right direction.",
    ],
    choices: [
      {
        id: "need-website",
        label: "I need a new website",
        next: "website",
      },
      {
        id: "need-store",
        label: "I need an online store",
        next: "store",
      },
      {
        id: "need-marketing",
        label: "I need more leads and traffic",
        next: "marketing",
      },
      {
        id: "something-else",
        label: "Something else",
        next: "other",
      },
      {
        id: "just-looking",
        label: "Just looking around",
        next: "browsing",
      },
    ],
  },

  website: {
    id: "website",
    kind: "question",
    messages: [
      "Nice. Is this a brand new website, or fixing one that isn't pulling its weight?",
    ],
    choices: [
      {
        id: "website-scratch",
        label: "Starting from scratch",
        next: "website_pitch",
      },
      {
        id: "website-redesign",
        label: "Redesigning an existing site",
        next: "website_pitch",
      },
      {
        id: "website-slow",
        label: "My site is slow or outdated",
        next: "website_pitch",
      },
    ],
  },

  website_pitch: {
    id: "website_pitch",
    kind: "question",
    messages: [
      "We build custom WordPress and fully coded websites that load fast, rank on Google, and actually convert visitors. Most projects go live in 3 to 6 weeks.",
      "Want to talk it through? The strategy call is free and there's no pitch, just honest advice.",
    ],
    choices: [
      {
        id: "website-book",
        label: "Book a free call",
        href: "/contact",
      },
      {
        id: "website-services",
        label: "See web development",
        href: servicePath({ slug: "wordpress-development" }),
      },
      {
        id: "website-email",
        label: "Email me instead",
        next: "email_form",
      },
    ],
  },

  store: {
    id: "store",
    kind: "question",
    messages: [
      "Great, e-commerce is our home turf. Which platform are you thinking, or not sure yet?",
    ],
    choices: [
      {
        id: "store-shopify",
        label: "Shopify",
        next: "store_shopify",
      },
      {
        id: "store-woo",
        label: "WooCommerce",
        next: "store_woo",
      },
      {
        id: "store-unsure",
        label: "Not sure, help me choose",
        next: "store_unsure",
      },
    ],
  },

  store_shopify: {
    id: "store_shopify",
    kind: "question",
    messages: [
      "Good choice. We build Shopify stores with custom design, smooth checkout, and the speed that keeps people buying.",
    ],
    choices: [
      {
        id: "shopify-book",
        label: "Book a free call",
        href: "/contact",
      },
      {
        id: "shopify-services",
        label: "See Shopify development",
        href: servicePath({ slug: "shopify-development" }),
      },
      {
        id: "shopify-email",
        label: "Email me instead",
        next: "email_form",
      },
    ],
  },

  store_woo: {
    id: "store_woo",
    kind: "question",
    messages: [
      "Good choice. We build WooCommerce stores with custom design, smooth checkout, and the speed that keeps people buying.",
    ],
    choices: [
      {
        id: "woo-book",
        label: "Book a free call",
        href: "/contact",
      },
      {
        id: "woo-services",
        label: "See WooCommerce development",
        href: servicePath({ slug: "woocommerce-development" }),
      },
      {
        id: "woo-email",
        label: "Email me instead",
        next: "email_form",
      },
    ],
  },

  store_unsure: {
    id: "store_unsure",
    kind: "question",
    messages: [
      "Honestly, it depends on your products, budget, and how much control you want. That's a 10 minute conversation, not a button click. Want to grab a free call and we'll figure out the right platform together?",
    ],
    choices: [
      {
        id: "unsure-book",
        label: "Book a free call",
        href: "/contact",
      },
      {
        id: "unsure-email",
        label: "Email me instead",
        next: "email_form",
      },
    ],
  },

  marketing: {
    id: "marketing",
    kind: "question",
    messages: ["Got it. What's the bigger problem right now?"],
    choices: [
      {
        id: "marketing-seo",
        label: "Nobody finds us on Google",
        next: "marketing_seo",
      },
      {
        id: "marketing-cro",
        label: "We get traffic but no sales",
        next: "marketing_cro",
      },
      {
        id: "marketing-ads",
        label: "We need to run ads",
        next: "marketing_ads",
      },
      {
        id: "marketing-all",
        label: "All of the above",
        next: "marketing_all",
      },
    ],
  },

  marketing_seo: {
    id: "marketing_seo",
    kind: "question",
    messages: [
      "That's an SEO problem, and it's fixable. We handle everything from technical fixes to content that ranks, including showing up in AI search results like ChatGPT.",
    ],
    choices: [
      {
        id: "seo-book",
        label: "Book a free call",
        href: "/contact",
      },
      {
        id: "seo-services",
        label: "See digital marketing",
        href: servicePath({ slug: "digital-marketing" }),
      },
      {
        id: "seo-email",
        label: "Email me instead",
        next: "email_form",
      },
    ],
  },

  marketing_cro: {
    id: "marketing_cro",
    kind: "question",
    messages: [
      "Then the traffic isn't the problem, the website is. That's usually a conversion issue, and it's one of our favorite things to fix because the wins show up fast.",
    ],
    choices: [
      {
        id: "cro-book",
        label: "Book a free call",
        href: "/contact",
      },
      {
        id: "cro-email",
        label: "Email me instead",
        next: "email_form",
      },
    ],
  },

  marketing_ads: {
    id: "marketing_ads",
    kind: "question",
    messages: [
      "We run Google and social ads with one rule: the numbers have to make sense. You'll always know exactly what you spent and what came back.",
    ],
    choices: [
      {
        id: "ads-book",
        label: "Book a free call",
        href: "/contact",
      },
      {
        id: "ads-services",
        label: "See digital marketing",
        href: servicePath({ slug: "digital-marketing" }),
      },
      {
        id: "ads-email",
        label: "Email me instead",
        next: "email_form",
      },
    ],
  },

  marketing_all: {
    id: "marketing_all",
    kind: "question",
    messages: [
      "Then you need a plan, not a patch. That's exactly what our free strategy call is for.",
    ],
    choices: [
      {
        id: "all-book",
        label: "Book a free call",
        href: "/contact",
      },
      {
        id: "all-email",
        label: "Email me instead",
        next: "email_form",
      },
    ],
  },

  other: {
    id: "other",
    kind: "question",
    messages: [
      "No problem. We also do video editing, virtual assistant support, and ongoing site maintenance. Or if it's something totally different, just tell us. What sounds closest?",
    ],
    choices: [
      {
        id: "other-video",
        label: "Video editing",
        next: "other_video",
      },
      {
        id: "other-va",
        label: "Virtual assistant",
        next: "other_va",
      },
      {
        id: "other-question",
        label: "Just have a question",
        next: "email_form_with_message",
      },
    ],
  },

  other_video: {
    id: "other_video",
    kind: "question",
    messages: [
      "We turn raw footage into marketing content that people actually watch. Color grading, motion graphics, sound design, the whole thing.",
    ],
    choices: [
      {
        id: "video-book",
        label: "Book a free call",
        href: "/contact",
      },
      {
        id: "video-services",
        label: "See video editing",
        href: servicePath({ slug: "video-editing", parentSlug: "digital-marketing" }),
      },
      {
        id: "video-email",
        label: "Email me instead",
        next: "email_form",
      },
    ],
  },

  other_va: {
    id: "other_va",
    kind: "question",
    messages: [
      "Our virtual assistants handle the admin, customer service, and content busywork so you can focus on running the business.",
    ],
    choices: [
      {
        id: "va-book",
        label: "Book a free call",
        href: "/contact",
      },
      {
        id: "va-services",
        label: "See virtual assistant",
        href: servicePath({ slug: "virtual-assistant", parentSlug: "digital-marketing" }),
      },
      {
        id: "va-email",
        label: "Email me instead",
        next: "email_form",
      },
    ],
  },

  browsing: {
    id: "browsing",
    kind: "question",
    messages: [
      "Totally fine, no pressure. If you get curious, our case studies show real numbers from real clients. I'll be here if you need me.",
    ],
    choices: [
      {
        id: "browsing-cases",
        label: "See case studies",
        href: workIndexPath,
      },
      {
        id: "browsing-question",
        label: "Actually, I do have a question",
        next: "email_form_with_message",
      },
    ],
  },

  email_form: {
    id: "email_form",
    kind: "form",
    intro:
      "Drop your details and the Kavcom team will personally get back to you within one business day. No newsletters, no spam, promise.",
  },

  email_form_with_message: {
    id: "email_form_with_message",
    kind: "form",
    intro:
      "Drop your details and the Kavcom team will personally get back to you within one business day. No newsletters, no spam, promise.",
    includeMessage: true,
    messagePlaceholder: "What's on your mind?",
  },

  success: {
    id: "success",
    kind: "success",
    messages: [
      "Done! Your message is with us. The Kavcom team will reach out within one business day.",
      "Meanwhile, feel free to browse our case studies, the results speak for themselves.",
    ],
    choices: [
      {
        id: "success-cases",
        label: "See case studies",
        href: workIndexPath,
      },
      {
        id: "success-restart",
        label: "Start over",
        next: "greeting",
      },
    ],
  },

  fallback: {
    id: "fallback",
    kind: "fallback",
    messages: [
      "Hmm, let's start fresh so I don't point you the wrong way.",
    ],
    next: "greeting",
  },
};

function isFlowNode(value: unknown): value is FlowNode {
  if (!value || typeof value !== "object") return false;
  const node = value as Record<string, unknown>;
  if (typeof node.id !== "string" || typeof node.kind !== "string") {
    return false;
  }
  if (
    node.kind !== "question" &&
    node.kind !== "form" &&
    node.kind !== "success" &&
    node.kind !== "fallback"
  ) {
    return false;
  }
  return true;
}

/** Parse CMS JSON into a flow map. Empty/invalid → null (use code defaults). */
export function parseChatbotFlowJson(
  raw: string | undefined | null,
): Record<string, FlowNode> | null {
  if (!raw || !raw.trim()) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    const record = parsed as Record<string, unknown>;
    const nodes: Record<string, FlowNode> = {};
    for (const [key, value] of Object.entries(record)) {
      if (!isFlowNode(value)) return null;
      nodes[key] = value;
    }
    return Object.keys(nodes).length > 0 ? nodes : null;
  } catch {
    return null;
  }
}

export function getFlowNode(
  id: string,
  nodes: Record<string, FlowNode> = flowNodes,
): FlowNode | undefined {
  return nodes[id];
}

export function getNodeMessages(node: FlowNode): string[] {
  if (node.kind === "form") {
    return [];
  }

  return node.messages;
}

export function isLinkChoice(
  choice: FlowChoice,
): choice is Extract<FlowChoice, { href: string }> {
  return "href" in choice;
}

export function formatPath(labels: string[]): string {
  return labels.join(" > ");
}
