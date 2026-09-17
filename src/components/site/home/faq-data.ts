export type FaqEntry = {
  question: string;
  answer: string;
};

export const homeFaqItems: readonly FaqEntry[] = [
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
