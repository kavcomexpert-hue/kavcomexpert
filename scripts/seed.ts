import { config } from "dotenv";
import { eq } from "drizzle-orm";

config({ path: ".env.local" });

function tiptapDoc(...paragraphs: string[]) {
  return {
    type: "doc",
    content: paragraphs.map((text) => ({
      type: "paragraph",
      content: [{ type: "text", text }],
    })),
  };
}

async function seed() {
  const { db } = await import("../src/lib/db/index");
  const {
    caseStudies,
    caseStudyCategories,
    categories,
    menus,
    pages,
    postCategories,
    postTags,
    posts,
    services,
    siteSettings,
    tags,
    testimonials,
  } = await import("../src/lib/db/schema");

  console.log("Seeding database…");

  /* -------------------------------------------------------------------------- */
  /* Site settings                                                              */
  /* -------------------------------------------------------------------------- */

  const [existingSettings] = await db.select().from(siteSettings).limit(1);
  const settingsValues = {
    organizationName: "Kavcom Expert",
    tagline: "From Vision To Virtual - We Build It All",
    defaultOgImage: "/logo.png",
    socialLinks: {
      linkedin: "https://linkedin.com/company/kavcomexpert",
      twitter: "https://twitter.com/kavcomexpert",
      instagram: "https://instagram.com/kavcomexpert",
    },
    announcementText: "Now offering AEO & GEO strategy for AI-first search.",
    announcementEnabled: true,
    contactEmail: "hello@kavcomexpert.com",
    ga4Id: null as string | null,
    clarityId: null as string | null,
    indexNowKey: null as string | null,
    sitemapExcludedPaths: ["/admin", "/api"] as string[],
  };

  if (existingSettings) {
    await db
      .update(siteSettings)
      .set(settingsValues)
      .where(eq(siteSettings.id, existingSettings.id));
  } else {
    await db.insert(siteSettings).values(settingsValues);
  }

  /* -------------------------------------------------------------------------- */
  /* Taxonomy                                                                   */
  /* -------------------------------------------------------------------------- */

  const categoryRows = [
    {
      name: "Search Strategy",
      slug: "search-strategy",
      description: "SEO, AEO, and visibility playbooks.",
    },
    {
      name: "Web Development",
      slug: "web-development",
      description: "Platform builds, migrations, and performance.",
    },
    {
      name: "Growth Marketing",
      slug: "growth-marketing",
      description: "Demand gen, content, and conversion.",
    },
  ] as const;

  for (const row of categoryRows) {
    await db.insert(categories).values(row).onConflictDoNothing();
  }

  const tagRows = [
    { name: "AEO", slug: "aeo" },
    { name: "Next.js", slug: "nextjs" },
    { name: "WordPress", slug: "wordpress" },
    { name: "Shopify", slug: "shopify" },
    { name: "Conversion", slug: "conversion" },
  ] as const;

  for (const row of tagRows) {
    await db.insert(tags).values(row).onConflictDoNothing();
  }

  const allCategories = await db.select().from(categories);
  const allTags = await db.select().from(tags);
  const categoryBySlug = Object.fromEntries(
    allCategories.map((c) => [c.slug, c.id]),
  );
  const tagBySlug = Object.fromEntries(allTags.map((t) => [t.slug, t.id]));

  /* -------------------------------------------------------------------------- */
  /* Posts                                                                      */
  /* -------------------------------------------------------------------------- */

  const scheduledFor = new Date(Date.now() + 60 * 60 * 1000);

  const postDefs = [
    {
      slug: "aeo-vs-seo-what-changes-in-2026",
      title: "AEO vs SEO: What Changes in 2026",
      excerpt:
        "Answer Engine Optimization is reshaping how brands earn visibility. Here is what still works from classic SEO and what needs to evolve.",
      content: tiptapDoc(
        "Search is splitting into two lanes: traditional results pages and AI-generated answers.",
        "Brands that structure content for direct answers, entity clarity, and citation-worthy sources will win both.",
        "Start by auditing which queries already trigger AI overviews in your category, then map content gaps.",
      ),
      coverImage: "/logo.png",
      category: "Search Strategy",
      categorySlug: "search-strategy",
      tagSlugs: ["aeo", "conversion"],
      status: "published" as const,
      publishedAt: new Date("2026-03-12T09:00:00Z"),
      scheduledFor: null as Date | null,
      readingMinutes: 8,
      tldr: "AEO complements SEO by optimizing for AI answers, not just classic rankings.",
      keyTakeaways: [
        "AI overviews change how buyers discover brands",
        "Entity clarity and citations matter more than keyword density",
        "Audit AI-triggered queries before rewriting your content map",
      ],
      focusKeyword: "answer engine optimization",
      metaTitle: "AEO vs SEO in 2026 | Kavcom Expert",
      metaDescription:
        "Learn how Answer Engine Optimization differs from SEO and what to prioritize for AI search visibility in 2026.",
      canonicalUrl: "https://kavcomexpert.com/blog/aeo-vs-seo-what-changes-in-2026",
      ogImage: "/logo.png",
      noIndex: false,
    },
    {
      slug: "technical-seo-checklist-for-nextjs",
      title: "Technical SEO Checklist for Next.js Marketing Sites",
      excerpt:
        "A practical audit list for App Router sites: metadata, crawlability, Core Web Vitals, and structured data without sacrificing DX.",
      content: tiptapDoc(
        "Next.js gives you server components and fine-grained caching. Use them to ship fast, indexable pages by default.",
        "Validate metadata on every route template, including canonical URLs and Open Graph images.",
        "Monitor CWV in production, not just Lighthouse in dev, especially after adding third-party scripts.",
      ),
      coverImage: "/logo.png",
      category: "Web Development",
      categorySlug: "web-development",
      tagSlugs: ["nextjs", "wordpress"],
      status: "published" as const,
      publishedAt: new Date("2026-02-04T14:30:00Z"),
      scheduledFor: null as Date | null,
      readingMinutes: 6,
      tldr: "Ship Next.js marketing sites that are crawlable, fast, and schema-ready from day one.",
      keyTakeaways: [
        "Treat metadata as a first-class route concern",
        "Validate Core Web Vitals in production",
        "Keep structured data aligned with visible content",
      ],
      focusKeyword: "Next.js technical SEO",
      metaTitle: "Next.js Technical SEO Checklist | Kavcom Expert",
      metaDescription:
        "Ship a fast, crawlable Next.js marketing site with this technical SEO checklist for metadata, performance, and schema.",
      canonicalUrl:
        "https://kavcomexpert.com/blog/technical-seo-checklist-for-nextjs",
      ogImage: "/logo.png",
      noIndex: false,
    },
    {
      slug: "shopify-conversion-playbook",
      title: "Shopify Conversion Playbook for Growing Stores",
      excerpt:
        "Scheduled deep dive on PDP clarity, cart recovery, and speed budgets that move revenue without a full redesign.",
      content: tiptapDoc(
        "This post will cover high-leverage Shopify conversion fixes for stores past their first $50k month.",
        "Expect a checklist for PDP trust signals, checkout friction, and performance budgets.",
      ),
      coverImage: "/logo.png",
      category: "Growth Marketing",
      categorySlug: "growth-marketing",
      tagSlugs: ["shopify", "conversion"],
      status: "scheduled" as const,
      publishedAt: null as Date | null,
      scheduledFor,
      readingMinutes: 9,
      tldr: "Small Shopify UX and speed fixes often outperform a full redesign for conversion lift.",
      keyTakeaways: [
        "Clarify PDP value props above the fold",
        "Reduce checkout friction before adding more apps",
        "Set a hard performance budget for theme scripts",
      ],
      focusKeyword: "Shopify conversion optimization",
      metaTitle: "Shopify Conversion Playbook | Kavcom Expert",
      metaDescription:
        "A practical Shopify conversion playbook covering PDP clarity, cart recovery, and speed budgets.",
      canonicalUrl:
        "https://kavcomexpert.com/blog/shopify-conversion-playbook",
      ogImage: "/logo.png",
      noIndex: true,
    },
  ];

  for (const post of postDefs) {
    const {
      categorySlug,
      tagSlugs,
      ...values
    } = post;

    const [upserted] = await db
      .insert(posts)
      .values({
        ...values,
        tags: tagSlugs,
        schemaType: "BlogPosting",
        sitemapInclude: true,
        sitemapPriority: "0.7",
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: posts.slug,
        set: {
          ...values,
          tags: tagSlugs,
          schemaType: "BlogPosting",
          sitemapInclude: true,
          sitemapPriority: "0.7",
          updatedAt: new Date(),
        },
      })
      .returning({ id: posts.id });

    const postId = upserted.id;
    const categoryId = categoryBySlug[categorySlug];
    if (categoryId) {
      await db
        .insert(postCategories)
        .values({ postId, categoryId })
        .onConflictDoNothing();
    }
    for (const tagSlug of tagSlugs) {
      const tagId = tagBySlug[tagSlug];
      if (!tagId) continue;
      await db
        .insert(postTags)
        .values({ postId, tagId })
        .onConflictDoNothing();
    }
  }

  /* -------------------------------------------------------------------------- */
  /* Pages                                                                      */
  /* -------------------------------------------------------------------------- */

  const pageDefs = [
    {
      slug: "privacy-policy",
      title: "Privacy Policy",
      heroEyebrow: "Legal",
      heroSubtext:
        "How Kavcom Expert collects, uses, and protects your information.",
      content: tiptapDoc(
        "This privacy policy describes how Kavcom Expert handles personal data when you visit our website or submit a contact form.",
        "We collect information you provide directly, such as your name, email address, company, and message content.",
        "We use this information to respond to inquiries, deliver services, and improve our website experience.",
        "We do not sell personal information. We may share data with service providers who assist our operations under confidentiality obligations.",
        "TODO: Update this section — we use analytics cookies (Google Analytics 4 and Microsoft Clarity) only after you accept via our cookie consent banner. Declining means those scripts do not load. Your choice is stored in localStorage for 12 months and can be changed anytime via Cookie preferences in the footer.",
        "You may request access, correction, or deletion of your personal data by contacting us.",
        "This policy may be updated periodically. Continued use of the site after changes constitutes acceptance of the revised policy.",
      ),
      showCta: false,
      status: "published" as const,
      publishedAt: new Date("2026-01-01T00:00:00Z"),
      metaTitle: "Privacy Policy | Kavcom Expert",
      metaDescription:
        "Read how Kavcom Expert collects, uses, and protects personal information on kavcomexpert.com.",
      canonicalUrl: "https://kavcomexpert.com/privacy-policy",
      schemaType: "WebPage",
      noIndex: false,
    },
    {
      slug: "terms-of-service",
      title: "Terms of Service",
      heroEyebrow: "Legal",
      heroSubtext:
        "The terms governing use of the Kavcom Expert website and services.",
      content: tiptapDoc(
        "By accessing kavcomexpert.com, you agree to these Terms of Service.",
        "Website content is provided for general information and marketing purposes. It does not constitute professional advice.",
        "Service engagements are governed by separate statements of work or agreements that supersede these terms where applicable.",
        "You agree not to misuse the site, attempt unauthorized access, or interfere with site operation.",
        "All site content, branding, and materials are owned by Kavcom Expert unless otherwise noted.",
        "We may update these terms at any time. Material changes will be reflected on this page.",
      ),
      showCta: false,
      status: "published" as const,
      publishedAt: new Date("2026-01-01T00:00:00Z"),
      metaTitle: "Terms of Service | Kavcom Expert",
      metaDescription:
        "Terms of Service for using the Kavcom Expert website and related marketing materials.",
      canonicalUrl: "https://kavcomexpert.com/terms-of-service",
      schemaType: "WebPage",
      noIndex: false,
    },
  ];

  for (const page of pageDefs) {
    await db
      .insert(pages)
      .values({
        ...page,
        sitemapInclude: true,
        sitemapPriority: "0.5",
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: pages.slug,
        set: {
          ...page,
          sitemapInclude: true,
          sitemapPriority: "0.5",
          updatedAt: new Date(),
        },
      });
  }

  /* -------------------------------------------------------------------------- */
  /* Testimonials                                                               */
  /* -------------------------------------------------------------------------- */

  const testimonialDefs = [
    {
      clientName: "Priya Sharma",
      company: "Northline Logistics",
      role: "VP Marketing",
      quote:
        "Kavcom rebuilt our site and organic pipeline in one quarter. We finally rank for terms our sales team actually uses on calls.",
      rating: 5,
      resultMetric: "+186% organic leads",
      // No headshot asset on disk; the review slider falls back to initials.
      headshot: null as string | null,
      videoUrl: null as string | null,
      serviceTag: "SEO",
      featured: true,
      sortOrder: 1,
      status: "published",
    },
    {
      clientName: "Marcus Chen",
      company: "Helio SaaS",
      role: "Founder",
      quote:
        "The new Next.js site loads instantly and our demo requests jumped. The team thinks in funnels, not just page builds.",
      rating: 5,
      resultMetric: "+42% demo conversions",
      headshot: null as string | null,
      videoUrl: null as string | null,
      serviceTag: "Web Development",
      featured: true,
      sortOrder: 2,
      status: "published",
    },
    {
      clientName: "Elena Rodriguez",
      company: "Brightpath Clinics",
      role: "Director of Growth",
      quote:
        "Their AEO work got us cited in AI answers for our core service lines. We are seeing qualified traffic we did not expect.",
      rating: 5,
      resultMetric: "Featured in 12 AI answers",
      headshot: null as string | null,
      videoUrl: null as string | null,
      serviceTag: "AEO/GEO",
      featured: false,
      sortOrder: 3,
      status: "published",
    },
    {
      clientName: "James Okonkwo",
      company: "Forge Industrial",
      role: "Marketing Manager",
      quote:
        "Social content finally matches our brand voice and drives traffic back to high-intent pages. Reporting is clear every month.",
      rating: 4,
      resultMetric: "3.2× social referral sessions",
      headshot: null as string | null,
      videoUrl: null as string | null,
      serviceTag: "Social Media",
      featured: false,
      sortOrder: 4,
      status: "published",
    },
  ];

  const existingTestimonials = await db.select().from(testimonials);
  if (existingTestimonials.length === 0) {
    await db.insert(testimonials).values(testimonialDefs);
  }

  const videoTestimonialDefs = [
    {
      clientName: "Tiffany Phillips",
      company: "Phillips Business Group",
      role: "Client",
      quote:
        "Kavcom delivered a website and marketing system our team can actually run day to day.",
      rating: 5,
      resultMetric: null as string | null,
      headshot: null as string | null,
      videoUrl: "https://www.youtube.com/watch?v=q0gnm8rqBH4",
      serviceTag: "Web Development",
      featured: true,
      sortOrder: 10,
      status: "published",
    },
    {
      clientName: "Beverly Grace",
      company: "Grace Realty & Property Mgmt",
      role: "Client",
      quote:
        "Clear communication, strong execution, and results we can point to with new clients.",
      rating: 5,
      resultMetric: null as string | null,
      headshot: null as string | null,
      videoUrl: "https://www.youtube.com/watch?v=bnMqf2r1yQ0",
      serviceTag: "Digital Marketing",
      featured: true,
      sortOrder: 11,
      status: "published",
    },
    {
      clientName: "Kristen Allen Pulanco",
      company: "Perfunnle Inc.",
      role: "Client",
      quote:
        "The team understood our brand voice and turned it into a site that converts.",
      rating: 5,
      resultMetric: null as string | null,
      headshot: null as string | null,
      videoUrl: "https://www.youtube.com/watch?v=nDNhIcfkLQY",
      serviceTag: "Web Development",
      featured: true,
      sortOrder: 12,
      status: "published",
    },
    {
      clientName: "Dane Richardshon",
      company: "Headless Chicken Growth Group",
      role: "Client",
      quote:
        "Practical growth work with reporting that makes sense to non-marketers.",
      rating: 5,
      resultMetric: null as string | null,
      headshot: null as string | null,
      videoUrl: "https://www.youtube.com/watch?v=wv1C4oUA7pQ",
      serviceTag: "SEO",
      featured: true,
      sortOrder: 13,
      status: "published",
    },
  ];

  for (const def of videoTestimonialDefs) {
    const [existing] = await db
      .select({ id: testimonials.id, videoUrl: testimonials.videoUrl })
      .from(testimonials)
      .where(eq(testimonials.clientName, def.clientName))
      .limit(1);

    if (!existing) {
      await db.insert(testimonials).values(def);
      continue;
    }

    if (!existing.videoUrl) {
      await db
        .update(testimonials)
        .set({
          videoUrl: def.videoUrl,
          company: def.company,
          featured: def.featured,
          sortOrder: def.sortOrder,
          status: def.status,
        })
        .where(eq(testimonials.id, existing.id));
    }
  }

  /* -------------------------------------------------------------------------- */
  /* Case studies                                                               */
  /* -------------------------------------------------------------------------- */

  const caseStudyDefs = [
    {
      slug: "northline-logistics-organic-growth",
      client: "Northline Logistics",
      industry: "B2B Logistics",
      challenge:
        "Legacy WordPress site with thin location pages and declining organic visibility in competitive freight keywords.",
      solution: tiptapDoc(
        "Migrated to Next.js with structured service and location templates.",
        "Implemented entity-focused content hubs and internal linking between corridors and service lines.",
        "Deployed schema markup for Organization, Service, and FAQ across key landing pages.",
      ),
      results: [
        { metric: "312%", label: "Organic traffic growth" },
        { metric: "94", label: "Page-1 keyword rankings" },
        { metric: "2.4×", label: "Inbound quote requests" },
      ],
      timeline: "6 months",
      gallery: [
        {
          url: "/blog-media/Dashboard-115d51468c2350a5.png",
          alt: "Before redesign",
        },
        {
          url: "/blog-media/Ecommerce-trends-2026-3409a684abc83b91.png",
          alt: "After redesign",
        },
      ],
      clientQuote: {
        quote:
          "Kavcom rebuilt our site and organic pipeline in one quarter. We finally rank for terms our sales team actually uses on calls.",
        name: "Priya Sharma",
        role: "VP Marketing",
        videoUrl: null,
      },
      serviceSlugs: ["wordpress-development", "digital-marketing"],
      status: "published" as const,
      publishedAt: new Date("2026-01-15T12:00:00Z"),
      categorySlug: "search-strategy",
      metaTitle: "Northline Logistics SEO Case Study | Kavcom Expert",
      metaDescription:
        "How Northline Logistics grew organic traffic 312% with a Next.js rebuild and entity-focused SEO strategy.",
      canonicalUrl:
        "https://kavcomexpert.com/work/northline-logistics-organic-growth",
      ogImage: "/logo.png",
      schemaType: "Article",
      focusKeyword: "logistics SEO case study",
    },
    {
      slug: "helio-saas-conversion-redesign",
      client: "Helio SaaS",
      industry: "B2B SaaS",
      challenge:
        "High traffic from content but poor demo conversion due to slow pages, unclear positioning, and fragmented messaging.",
      solution: tiptapDoc(
        "Redesigned the marketing site with a unified narrative and performance-first App Router architecture.",
        "Introduced comparison and use-case pages aligned to high-intent search terms.",
        "Integrated analytics events tied to pipeline stages for continuous iteration.",
      ),
      results: [
        { metric: "68%", label: "Faster LCP" },
        { metric: "42%", label: "Demo conversion lift" },
        { metric: "−31%", label: "Bounce rate on pricing" },
      ],
      timeline: "4 months",
      gallery: [
        {
          url: "/blog-media/Landing-Page-Conversions-60ec93aba9667350.png",
          alt: "Helio homepage",
        },
        {
          url: "/blog-media/Ai-in-Digital-Marketing-Kavcom-Expert-6b56f27f749f114e.png",
          alt: "Helio pricing page",
        },
      ],
      clientQuote: {
        quote:
          "The new Next.js site loads instantly and our demo requests jumped. The team thinks in funnels, not just page builds.",
        name: "Marcus Chen",
        role: "Founder",
        videoUrl: null,
      },
      serviceSlugs: ["shopify-development", "digital-marketing"],
      status: "published" as const,
      publishedAt: new Date("2026-02-20T12:00:00Z"),
      categorySlug: "web-development",
      metaTitle: "Helio SaaS Web Redesign Case Study | Kavcom Expert",
      metaDescription:
        "Helio SaaS improved demo conversions 42% with a fast Next.js marketing site and clearer positioning.",
      canonicalUrl: "https://kavcomexpert.com/work/helio-saas-conversion-redesign",
      ogImage: "/logo.png",
      schemaType: "Article",
      focusKeyword: "SaaS website redesign case study",
    },
  ];

  for (const study of caseStudyDefs) {
    const { categorySlug, ...values } = study;
    const [upserted] = await db
      .insert(caseStudies)
      .values({
        ...values,
        sitemapInclude: true,
        sitemapPriority: "0.8",
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: caseStudies.slug,
        set: {
          ...values,
          sitemapInclude: true,
          sitemapPriority: "0.8",
          updatedAt: new Date(),
        },
      })
      .returning({ id: caseStudies.id });

    const categoryId = categoryBySlug[categorySlug];
    if (categoryId) {
      await db
        .insert(caseStudyCategories)
        .values({ caseStudyId: upserted.id, categoryId })
        .onConflictDoNothing();
    }
  }

  /* -------------------------------------------------------------------------- */
  /* Services (site-real set)                                                   */
  /* -------------------------------------------------------------------------- */

  const serviceFaqs = (items: { question: string; answer: string }[]) => items;

  const serviceDefs = [
    {
      slug: "wordpress-development",
      name: "WordPress Development",
      shortPitch:
        "Custom WordPress sites with clean architecture, SEO foundations, and editor-friendly workflows.",
      body: tiptapDoc(
        "We build WordPress experiences that are fast, secure, and easy for your team to update.",
        "From marketing sites to complex content hubs, we ship production-ready themes and integrations.",
      ),
      deliverables: [
        "Custom theme or block-based build",
        "Performance and security hardening",
        "SEO-ready templates",
        "Editor training and handoff",
      ],
      faqs: serviceFaqs([
        {
          question: "Do you migrate existing WordPress sites?",
          answer:
            "Yes. We plan URL mapping, redirects, and content migration so SEO equity is preserved.",
        },
        {
          question: "Can non-developers edit the site?",
          answer:
            "Yes. We design editor workflows around the block editor or a structured CMS pattern your team can own.",
        },
        {
          question: "Do you support WooCommerce?",
          answer:
            "Yes. WooCommerce builds are available as a dedicated service when you need a full store.",
        },
      ]),
      icon: "wordpress",
      sortOrder: 1,
      metaTitle: "WordPress Development | Kavcom Expert",
      metaDescription:
        "Custom WordPress development for fast, SEO-ready marketing sites and content platforms.",
      focusKeyword: "WordPress development",
    },
    {
      slug: "woocommerce-development",
      name: "WooCommerce Development",
      shortPitch:
        "Flexible WooCommerce stores built for growth, integrations, and conversion.",
      body: tiptapDoc(
        "We design and build WooCommerce stores that balance flexibility with maintainability.",
        "Checkout UX, catalog structure, and payment integrations are treated as growth systems, not afterthoughts.",
      ),
      deliverables: [
        "Store architecture and theme build",
        "Checkout and cart optimization",
        "Payment and shipping integrations",
        "Launch QA and training",
      ],
      faqs: serviceFaqs([
        {
          question: "Can you migrate from Shopify to WooCommerce?",
          answer:
            "Yes. We migrate products, customers, and critical SEO URLs with a redirect plan.",
        },
        {
          question: "Do you handle custom product logic?",
          answer:
            "Yes. Complex catalogs, bundles, and B2B pricing rules are common in our builds.",
        },
        {
          question: "Who hosts the store?",
          answer:
            "We can recommend and configure hosting, or work with your existing provider.",
        },
      ]),
      icon: "woocommerce",
      sortOrder: 2,
      metaTitle: "WooCommerce Development | Kavcom Expert",
      metaDescription:
        "WooCommerce store development focused on conversion, integrations, and long-term maintainability.",
      focusKeyword: "WooCommerce development",
    },
    {
      slug: "shopify-development",
      name: "Shopify Development",
      shortPitch:
        "High-converting Shopify storefronts with clean themes and growth-ready apps.",
      body: tiptapDoc(
        "We build Shopify experiences that load fast and convert with clear merchandising.",
        "Theme customization, app strategy, and CRO testing are part of every engagement.",
      ),
      deliverables: [
        "Theme customization or custom sections",
        "App stack recommendations",
        "Conversion-focused PDP templates",
        "Analytics and launch support",
      ],
      faqs: serviceFaqs([
        {
          question: "Do you work with Shopify Plus?",
          answer:
            "Yes. We support both standard Shopify and Plus builds depending on scale.",
        },
        {
          question: "Can you improve an existing theme?",
          answer:
            "Yes. Many projects start with a CRO and performance pass on the current theme.",
        },
        {
          question: "Do you handle migrations into Shopify?",
          answer:
            "Yes. We migrate catalogs and set up redirects to protect organic traffic.",
        },
      ]),
      icon: "shopify",
      sortOrder: 3,
      metaTitle: "Shopify Development | Kavcom Expert",
      metaDescription:
        "Shopify development for fast, conversion-focused storefronts and scalable ecommerce growth.",
      focusKeyword: "Shopify development",
    },
    {
      slug: "digital-marketing",
      name: "Digital Marketing",
      shortPitch:
        "Full-funnel digital marketing that connects traffic, content, and pipeline.",
      body: tiptapDoc(
        "We plan and run digital programs across SEO, paid, and social with clear attribution.",
        "Reporting ties activity to leads and revenue, not vanity metrics.",
      ),
      deliverables: [
        "Channel strategy and roadmap",
        "Campaign setup and creative direction",
        "Landing page recommendations",
        "Monthly performance reporting",
      ],
      faqs: serviceFaqs([
        {
          question: "Which channels do you cover?",
          answer:
            "SEO, Google Ads, Meta, LinkedIn, and social content depending on your ICP.",
        },
        {
          question: "Do you need an existing website?",
          answer:
            "A solid site helps, but we can sequence site improvements alongside campaigns.",
        },
        {
          question: "How do you measure success?",
          answer:
            "We define KPIs up front: qualified leads, CAC, ROAS, and pipeline influence.",
        },
      ]),
      icon: "megaphone",
      sortOrder: 4,
      metaTitle: "Digital Marketing Services | Kavcom Expert",
      metaDescription:
        "Digital marketing services that connect SEO, paid, and social to measurable pipeline growth.",
      focusKeyword: "digital marketing agency",
    },
    {
      slug: "video-editing",
      name: "Video Editing",
      shortPitch:
        "Brand-aligned video editing for ads, social, and website storytelling.",
      body: tiptapDoc(
        "We edit video that supports campaigns and product narratives with a consistent brand voice.",
        "From short-form social cuts to longer explainers, delivery is organized around your publishing calendar.",
      ),
      deliverables: [
        "Edit packages by channel",
        "Motion graphics and captions",
        "Thumbnail and cutdown variants",
        "Revision rounds and asset handoff",
      ],
      faqs: serviceFaqs([
        {
          question: "What formats do you deliver?",
          answer:
            "Vertical, square, and landscape exports sized for the channels you publish on.",
        },
        {
          question: "Do you need raw footage from us?",
          answer:
            "Yes. We work from your footage or coordinate with production partners when needed.",
        },
        {
          question: "How fast is turnaround?",
          answer:
            "Typical short-form turnaround is 3 to 5 business days depending on volume.",
        },
      ]),
      icon: "video",
      sortOrder: 5,
      metaTitle: "Video Editing Services | Kavcom Expert",
      metaDescription:
        "Professional video editing for ads, social content, and brand storytelling.",
      focusKeyword: "video editing services",
    },
    {
      slug: "virtual-assistant",
      name: "Virtual Assistant",
      shortPitch:
        "Reliable virtual assistant support for operations, research, and marketing admin.",
      body: tiptapDoc(
        "Our VA support keeps recurring work moving so your team can focus on higher-leverage decisions.",
        "Scopes typically include research, CRM hygiene, content ops, and calendar coordination.",
      ),
      deliverables: [
        "Dedicated VA hours",
        "SOP-driven task execution",
        "Weekly status updates",
        "Tooling setup and documentation",
      ],
      faqs: serviceFaqs([
        {
          question: "What tools can VAs work in?",
          answer:
            "Common stacks include Google Workspace, Notion, HubSpot, Slack, and project tools you already use.",
        },
        {
          question: "Is support US-hours only?",
          answer:
            "We align coverage to your operating hours and response expectations during onboarding.",
        },
        {
          question: "Can VA work support marketing campaigns?",
          answer:
            "Yes. Research, list building, reporting prep, and content ops are frequent requests.",
        },
      ]),
      icon: "assistant",
      sortOrder: 6,
      metaTitle: "Virtual Assistant Services | Kavcom Expert",
      metaDescription:
        "Virtual assistant support for operations, research, and marketing administration.",
      focusKeyword: "virtual assistant services",
    },
  ];

  for (const service of serviceDefs) {
    await db
      .insert(services)
      .values({
        ...service,
        status: "published",
        schemaType: "Service",
        sitemapInclude: true,
        sitemapPriority: "0.8",
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: services.slug,
        set: {
          ...service,
          status: "published",
          schemaType: "Service",
          sitemapInclude: true,
          sitemapPriority: "0.8",
          updatedAt: new Date(),
        },
      });
  }

  /* -------------------------------------------------------------------------- */
  /* Menus (jsonb locations per spec)                                           */
  /* -------------------------------------------------------------------------- */

  const menuDefs = [
    {
      location: "header",
      items: [
        {
          label: "Services",
          href: "/services",
          order: 0,
          children: [
            {
              label: "WordPress Development",
              href: "/services/wordpress-development",
              order: 0,
            },
            {
              label: "Shopify Development",
              href: "/services/shopify-development",
              order: 1,
            },
            {
              label: "Magento Development",
              href: "/services/magento-development",
              order: 2,
            },
            {
              label: "WooCommerce Development",
              href: "/services/woocommerce-development",
              order: 3,
            },
            {
              label: "Full-Stack Development",
              href: "/services/full-stack-development",
              order: 4,
            },
            {
              label: "Migration Services",
              href: "/services/migration-services",
              order: 5,
            },
          ],
        },
        {
          label: "Digital Marketing",
          href: "/services/digital-marketing",
          order: 1,
          children: [
            {
              label: "Virtual Assistant",
              href: "/services/virtual-assistant",
              order: 0,
            },
            {
              label: "Video Editing",
              href: "/services/video-editing",
              order: 1,
            },
            {
              label: "SEO & AI SEO Optimization",
              href: "/services/seo-ai-optimization",
              order: 2,
            },
          ],
        },
        { label: "Work", href: "/work", order: 2 },
        { label: "Blog", href: "/blog", order: 3 },
        { label: "About Us", href: "/about-us", order: 4 },
        { label: "Contact", href: "/contact-us", order: 5 },
      ],
    },
    {
      location: "footer-services",
      items: [
        {
          label: "WordPress Development",
          href: "/services/wordpress-development",
          order: 0,
        },
        {
          label: "Shopify Development",
          href: "/services/shopify-development",
          order: 1,
        },
        {
          label: "Magento Development",
          href: "/services/magento-development",
          order: 2,
        },
        {
          label: "Migration Services",
          href: "/services/migration-services",
          order: 3,
        },
      ],
    },
    {
      location: "footer-growth",
      items: [
        {
          label: "Digital Marketing Services",
          href: "/services/digital-marketing",
          order: 0,
        },
        {
          label: "Virtual Assistant Support",
          href: "/services/virtual-assistant",
          order: 1,
        },
        {
          label: "SEO & AI SEO Optimization",
          href: "/services/seo-ai-optimization",
          order: 2,
        },
        {
          label: "Video Editing",
          href: "/services/video-editing",
          order: 3,
        },
      ],
    },
    {
      location: "footer-company",
      items: [
        { label: "About Us", href: "/about-us", order: 0 },
        { label: "Work", href: "/work", order: 1 },
        { label: "Blog", href: "/blog", order: 2 },
        { label: "Career", href: "/careers", order: 3 },
        { label: "Contact", href: "/contact-us", order: 4 },
      ],
    },
  ] as const;

  type MenuItem = {
    label: string;
    href: string;
    order: number;
    children?: { label: string; href: string; order: number }[];
  };

  for (const menu of menuDefs) {
    const items = menu.items.map((item) => ({
      label: item.label,
      href: item.href,
      order: item.order,
      ...("children" in item && item.children
        ? {
            children: item.children.map((child) => ({
              label: child.label,
              href: child.href,
              order: child.order,
            })),
          }
        : {}),
    })) as MenuItem[];

    await db
      .insert(menus)
      .values({
        location: menu.location,
        items,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: menus.location,
        set: {
          items,
          updatedAt: new Date(),
        },
      });
  }

  console.log("Seed complete.");
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
