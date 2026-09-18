import type { NextConfig } from "next";

const r2PublicUrl = process.env.R2_PUBLIC_URL;
const r2Hostname = r2PublicUrl ? new URL(r2PublicUrl).hostname : null;

const remotePatterns: NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
> = [
  {
    protocol: "https",
    hostname: "i.ytimg.com",
    pathname: "/vi/**",
  },
];

if (r2Hostname) {
  remotePatterns.push({
    protocol: "https",
    hostname: r2Hostname,
    pathname: "/**",
  });
}

// Always allow Cloudflare's default public R2 host pattern when env is unset at
// build time (Hostinger often injects R2_PUBLIC_URL only at runtime).
remotePatterns.push({
  protocol: "https",
  hostname: "**.r2.dev",
  pathname: "/**",
});

const r2Origin = r2PublicUrl ? new URL(r2PublicUrl).origin : null;

/**
 * CSP is Report-Only so Next's inline runtime styles/scripts and third-party
 * tags are never blocked while we observe violations in the browser console.
 *
 * To enforce CSP safely later:
 * 1. Keep default-src 'self' as the baseline.
 * 2. Keep style-src 'self' 'unsafe-inline' (Next injects critical CSS inline).
 * 3. Confirm script-src includes 'self' plus every analytics/embed domain we
 *    actually load (GTM, GA, Clarity, etc.).
 * 4. Confirm img-src / media-src / connect-src include the R2 public host from
 *    R2_PUBLIC_URL (wired via r2Origin above).
 * 5. Run Report-Only in production for at least one week and triage console /
 *    report-uri violations until they are quiet for real traffic.
 * 6. Flip Content-Security-Policy-Report-Only → Content-Security-Policy below.
 * Do not enforce until steps 1–5 are done.
 */
const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://scripts.clarity.ms https://challenges.cloudflare.com`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: https://i.ytimg.com https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://api.qrserver.com${r2Origin ? ` ${r2Origin}` : ""}`,
  `font-src 'self' data:`,
  `connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://www.clarity.ms https://*.clarity.ms https://api.indexnow.org https://challenges.cloudflare.com${r2Origin ? ` ${r2Origin}` : ""}`,
  `frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://challenges.cloudflare.com`,
  `media-src 'self' blob:${r2Origin ? ` ${r2Origin}` : ""}`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
].join("; ");

const nextConfig: NextConfig = {
  // Expose R2 public origin to the client so SafeImage can skip /_next/image
  // for CDN assets (custom domain or r2.dev) without re-encoding via Sharp.
  env: {
    NEXT_PUBLIC_R2_PUBLIC_URL:
      process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
      process.env.R2_PUBLIC_URL ||
      "",
  },
  // Hostinger managed Node uses `next start` against the full `.next` output.
  // Do not set output: "standalone" — that requires manually copying
  // `.next/static` and `public` into the standalone folder, which breaks CSS/JS.
  // Large media uploads go through /api/admin/upload, not Server Actions.
  // Keep remaining actions small (forms, JSON) under this limit.
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
      allowedOrigins: [
        "kavcomexpert.com",
        "*.kavcomexpert.com",
      ],
    },
  },
  transpilePackages: ["@splinetool/react-spline", "@splinetool/runtime"],
  
  images: {
    remotePatterns,
    // WebP-only: AVIF encode is much heavier on Sharp/RSS for similar visual quality.
    formats: ["image/webp"],
    // Cache optimizer output for a year — same URL must not re-Sharp on every hit.
    minimumCacheTTL: 60 * 60 * 24 * 365,
    // Fewer variants → less Sharp decode/encode work per source image.
    deviceSizes: [640, 750, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  async redirects() {
    return [
      {
        source: "/contact",
        destination: "/contact-us",
        permanent: true,
      },
      {
        source: "/about",
        destination: "/about-us",
        permanent: true,
      },

      // --- Old WordPress blog posts: root -> /blog (98 rules) ---
      { source: "/7-effective-marketing-strategies-for-manufacturers-to-boost-sales", destination: "/blog/7-effective-marketing-strategies-for-manufacturers-to-boost-sales", permanent: true },
      { source: "/a-step-by-step-guide-for-shopify-to-bigcommerce-migration", destination: "/blog/a-step-by-step-guide-for-shopify-to-bigcommerce-migration", permanent: true },
      { source: "/adobe-commerce-2-4-7-released", destination: "/blog/adobe-commerce-2-4-7-released", permanent: true },
      { source: "/adobe-commerce-magento-2-ecommerce-review-2022", destination: "/blog/adobe-commerce-magento-2-ecommerce-review-2022", permanent: true },
      { source: "/adobe-commerce-review-2023", destination: "/blog/adobe-commerce-review-2023", permanent: true },
      { source: "/advantages-of-cheap-vps-hosting", destination: "/blog/advantages-of-cheap-vps-hosting", permanent: true },
      { source: "/ai-search-optimization-aeo-geo-2026", destination: "/blog/ai-search-optimization-aeo-geo-2026", permanent: true },
      { source: "/banner-advertising-losing-its-appeal", destination: "/blog/banner-advertising-losing-its-appeal", permanent: true },
      { source: "/beyond-the-basics-of-email-hosting-hosted-exchange-or-webmail", destination: "/blog/beyond-the-basics-of-email-hosting-hosted-exchange-or-webmail", permanent: true },
      { source: "/bigcommerce-blueprint-your-beginners-guide-to-ecommerce-bliss", destination: "/blog/bigcommerce-blueprint-your-beginners-guide-to-ecommerce-bliss", permanent: true },
      { source: "/bigcommerce-development-services-to-revolutionize", destination: "/blog/bigcommerce-development-services-to-revolutionize", permanent: true },
      { source: "/bigcommerce-development-services-unlocking", destination: "/blog/bigcommerce-development-services-unlocking", permanent: true },
      { source: "/bigcommerce-ecommerce-platform-ai-powered", destination: "/blog/bigcommerce-ecommerce-platform-ai-powered", permanent: true },
      { source: "/bluehost-best-web-hosting-company-for-wordpress", destination: "/blog/bluehost-best-web-hosting-company-for-wordpress", permanent: true },
      { source: "/bluehost-review-web-hosting-with-bluehost", destination: "/blog/bluehost-review-web-hosting-with-bluehost", permanent: true },
      { source: "/boost-your-expert-wordpress-speed-services", destination: "/blog/boost-your-expert-wordpress-speed-services", permanent: true },
      { source: "/boost-your-websites-performance-with-professional-wordpress-speed-optimization-services", destination: "/blog/boost-your-websites-performance-with-professional-wordpress-speed-optimization-services", permanent: true },
      { source: "/boost-your-websites-speed-and-security-with-cloudflare", destination: "/blog/boost-your-websites-speed-and-security-with-cloudflare", permanent: true },
      { source: "/cbd-web-design-a-comprehensive-guide-for-cannabis", destination: "/blog/cbd-web-design-a-comprehensive-guide-for-cannabis", permanent: true },
      { source: "/cdn-integration-for-improving-website", destination: "/blog/cdn-integration-for-improving-website", permanent: true },
      { source: "/cheap-web-hosting-and-what-server-to-choose", destination: "/blog/cheap-web-hosting-and-what-server-to-choose", permanent: true },
      { source: "/cloud-computing-for-small-businesses-cost-effective-strategies", destination: "/blog/cloud-computing-for-small-businesses-cost-effective-strategies", permanent: true },
      { source: "/compassion-and-hope-the-beating-heart-of-great-cbd-companies", destination: "/blog/compassion-and-hope-the-beating-heart-of-great-cbd-companies", permanent: true },
      { source: "/complete-information-on-dedicated-servers", destination: "/blog/complete-information-on-dedicated-servers", permanent: true },
      { source: "/continuity-and-disaster-recovery-in-business-analysis-of-business-impact", destination: "/blog/continuity-and-disaster-recovery-in-business-analysis-of-business-impact", permanent: true },
      { source: "/cross-border-e-commerce-expanding-your-reach-globally", destination: "/blog/cross-border-e-commerce-expanding-your-reach-globally", permanent: true },
      { source: "/custom-booking-system-a-step-by-step-coding-guide", destination: "/blog/custom-booking-system-a-step-by-step-coding-guide", permanent: true },
      { source: "/digital-marketing-cost-for-a-cpa-firm", destination: "/blog/digital-marketing-cost-for-a-cpa-firm", permanent: true },
      { source: "/ecommerce-trends-2026", destination: "/blog/ecommerce-trends-2026", permanent: true },
      { source: "/enhance-website-performance-with-professional-wordpress-speed-optimization-services", destination: "/blog/enhance-website-performance-with-professional-wordpress-speed-optimization-services", permanent: true },
      { source: "/everything-you-need-to-know-about-shared-and-reseller-hosting", destination: "/blog/everything-you-need-to-know-about-shared-and-reseller-hosting", permanent: true },
      { source: "/factors-to-consider-when-buying-cheap-web-hosting", destination: "/blog/factors-to-consider-when-buying-cheap-web-hosting", permanent: true },
      { source: "/factors-to-consider-when-choosing-web-hosting-resellers", destination: "/blog/factors-to-consider-when-choosing-web-hosting-resellers", permanent: true },
      { source: "/find-a-popular-host-using-web-hosting-review-sites", destination: "/blog/find-a-popular-host-using-web-hosting-review-sites", permanent: true },
      { source: "/free-adult-hosting-ways-to-find-the-best-free-adult-hosting-service", destination: "/blog/free-adult-hosting-ways-to-find-the-best-free-adult-hosting-service", permanent: true },
      { source: "/free-web-hosting", destination: "/blog/free-web-hosting", permanent: true },
      { source: "/getting-on-board-with-the-best-web-hosting-company", destination: "/blog/getting-on-board-with-the-best-web-hosting-company", permanent: true },
      { source: "/headless-wordpress-2026-guide", destination: "/blog/headless-wordpress-2026-guide", permanent: true },
      { source: "/how-to-be-a-blogger", destination: "/blog/how-to-be-a-blogger", permanent: true },
      { source: "/how-to-create-a-mobile-optimized-wordpress-site-for-better-seo-and-user-experience", destination: "/blog/how-to-create-a-mobile-optimized-wordpress-site-for-better-seo-and-user-experience", permanent: true },
      { source: "/how-to-create-your-very-own-flash-arcade-website-in-a-few-easy-steps", destination: "/blog/how-to-create-your-very-own-flash-arcade-website-in-a-few-easy-steps", permanent: true },
      { source: "/how-to-customize-a-wordpress-theme-without-breaking-it-complete-guide", destination: "/blog/how-to-customize-a-wordpress-theme-without-breaking-it-complete-guide", permanent: true },
      { source: "/how-to-migrate-a-wordpress-site-to-another-hosting", destination: "/blog/how-to-migrate-a-wordpress-site-to-another-hosting", permanent: true },
      { source: "/how-to-register-a-dot-com", destination: "/blog/how-to-register-a-dot-com", permanent: true },
      { source: "/how-to-select-a-right-managed-hosting-service-provider", destination: "/blog/how-to-select-a-right-managed-hosting-service-provider", permanent: true },
      { source: "/how-to-use-data-analytics-to-improve-your-e-commerce-business", destination: "/blog/how-to-use-data-analytics-to-improve-your-e-commerce-business", permanent: true },
      { source: "/improving-website-performance-with-cdn", destination: "/blog/improving-website-performance-with-cdn", permanent: true },
      { source: "/license-manager-for-woocommerce", destination: "/blog/license-manager-for-woocommerce", permanent: true },
      { source: "/live-shopping-leveraging-real-time-engagement-to-boost-sales", destination: "/blog/live-shopping-leveraging-real-time-engagement-to-boost-sales", permanent: true },
      { source: "/locations.kml", destination: "/blog/locations.kml", permanent: true },
      { source: "/magento-ecommerce-website-development", destination: "/blog/magento-ecommerce-website-development", permanent: true },
      { source: "/magento-upgrade-101-boosting-your-ecommerce", destination: "/blog/magento-upgrade-101-boosting-your-ecommerce", permanent: true },
      { source: "/marketing-solutions", destination: "/blog/marketing-solutions", permanent: true },
      { source: "/maximize-your-online-stores-adobe-commerce", destination: "/blog/maximize-your-online-stores-adobe-commerce", permanent: true },
      { source: "/migrate-to-ga4-google-analytics-4", destination: "/blog/migrate-to-ga4-google-analytics-4", permanent: true },
      { source: "/painting-business-marketing-tips-and-ideas", destination: "/blog/painting-business-marketing-tips-and-ideas", permanent: true },
      { source: "/php-web-development-beneficial-for-online", destination: "/blog/php-web-development-beneficial-for-online", permanent: true },
      { source: "/practices-for-bigcommerce-development-services", destination: "/blog/practices-for-bigcommerce-development-services", permanent: true },
      { source: "/projects", destination: "/blog/projects", permanent: true },
      { source: "/protect-your-critical-loads-with-vmware-fault-tolerance", destination: "/blog/protect-your-critical-loads-with-vmware-fault-tolerance", permanent: true },
      { source: "/seamless-transition-to-woocommerce-with-bigcommerce-to-woocommerce-migration-services", destination: "/blog/seamless-transition-to-woocommerce-with-bigcommerce-to-woocommerce-migration-services", permanent: true },
      { source: "/seo-and-social-media-for-e-commerce-success", destination: "/blog/seo-and-social-media-for-e-commerce-success", permanent: true },
      { source: "/shopify-scripts-to-functions-migration", destination: "/blog/shopify-scripts-to-functions-migration", permanent: true },
      { source: "/step-by-step-guide-build-a-custom-crm", destination: "/blog/step-by-step-guide-build-a-custom-crm", permanent: true },
      { source: "/the-big-question-wordpress-dot-org-or-wordpress-dot-com-for-your-small-business-blog", destination: "/blog/the-big-question-wordpress-dot-org-or-wordpress-dot-com-for-your-small-business-blog", permanent: true },
      { source: "/the-importance-of-on-page-seo-for-e-commerce-success", destination: "/blog/the-importance-of-on-page-seo-for-e-commerce-success", permanent: true },
      { source: "/the-mysterious-htaccess-file", destination: "/blog/the-mysterious-htaccess-file", permanent: true },
      { source: "/the-real-cbd-exposed", destination: "/blog/the-real-cbd-exposed", permanent: true },
      { source: "/the-web-hosting-money-back-guarantee", destination: "/blog/the-web-hosting-money-back-guarantee", permanent: true },
      { source: "/top-5-ways-to-optimize-your-internal-anchor-text", destination: "/blog/top-5-ways-to-optimize-your-internal-anchor-text", permanent: true },
      { source: "/top-features-every-custom-website-should-have-in-2025", destination: "/blog/top-features-every-custom-website-should-have-in-2025", permanent: true },
      { source: "/upgrade-to-magento-2-4-6-your-gateway-to-a-faster-more-secure-online-store", destination: "/blog/upgrade-to-magento-2-4-6-your-gateway-to-a-faster-more-secure-online-store", permanent: true },
      { source: "/upgrade-wordpress-6-5", destination: "/blog/upgrade-wordpress-6-5", permanent: true },
      { source: "/upgrade-your-wordpress-site-with-a-migration", destination: "/blog/upgrade-your-wordpress-site-with-a-migration", permanent: true },
      { source: "/uses-of-cpanel", destination: "/blog/uses-of-cpanel", permanent: true },
      { source: "/ux-magic-creating-seamless-user-journeys-in-website-design", destination: "/blog/ux-magic-creating-seamless-user-journeys-in-website-design", permanent: true },
      { source: "/voice-search-ecommerce", destination: "/blog/voice-search-ecommerce", permanent: true },
      { source: "/web-hosting-made-more-convenient-by-bluehost-web-hosting", destination: "/blog/web-hosting-made-more-convenient-by-bluehost-web-hosting", permanent: true },
      { source: "/website-from-core-php-to-bigcommerce", destination: "/blog/website-from-core-php-to-bigcommerce", permanent: true },
      { source: "/weighing-the-advantages-and-disadvantages-of-drupal-as-a-cms", destination: "/blog/weighing-the-advantages-and-disadvantages-of-drupal-as-a-cms", permanent: true },
      { source: "/what-is-web-development-how-does-it-work", destination: "/blog/what-is-web-development-how-does-it-work", permanent: true },
      { source: "/what-is-web-hosting-equipment-colocation", destination: "/blog/what-is-web-hosting-equipment-colocation", permanent: true },
      { source: "/what-is-your-business-value-add", destination: "/blog/what-is-your-business-value-add", permanent: true },
      { source: "/what-should-a-copywriter-portfolio-look-like", destination: "/blog/what-should-a-copywriter-portfolio-look-like", permanent: true },
      { source: "/what-you-need-to-know-before-using-cbd-oil", destination: "/blog/what-you-need-to-know-before-using-cbd-oil", permanent: true },
      { source: "/what-you-need-to-know-in-domain-name-registration", destination: "/blog/what-you-need-to-know-in-domain-name-registration", permanent: true },
      { source: "/why-should-one-choose-php-for-website-development", destination: "/blog/why-should-one-choose-php-for-website-development", permanent: true },
      { source: "/why-switching-from-wix-to-wordpress-is-a-smart-choice", destination: "/blog/why-switching-from-wix-to-wordpress-is-a-smart-choice", permanent: true },
      { source: "/why-upgrading-wordpress-plugins-and-source-code-is-essential-for-website-security", destination: "/blog/why-upgrading-wordpress-plugins-and-source-code-is-essential-for-website-security", permanent: true },
      { source: "/why-woocommerce-is-the-perfect-platform-for-growing-e-commerce-stores", destination: "/blog/why-woocommerce-is-the-perfect-platform-for-growing-e-commerce-stores", permanent: true },
      { source: "/why-your-business-needs-a-virtual-assistant", destination: "/blog/why-your-business-needs-a-virtual-assistant", permanent: true },
      { source: "/woocommerce-migration-how-to-move-your-store-to-a-new-host-or-platform", destination: "/blog/woocommerce-migration-how-to-move-your-store-to-a-new-host-or-platform", permanent: true },
      { source: "/woocommerce-migration-services-seamlessly", destination: "/blog/woocommerce-migration-services-seamlessly", permanent: true },
      { source: "/woocommerce-review-2023", destination: "/blog/woocommerce-review-2023", permanent: true },
      { source: "/wordpress-7-0-upgrade-guide", destination: "/blog/wordpress-7-0-upgrade-guide", permanent: true },
      { source: "/wordpress-blogging-tips-to-help-you-get-started", destination: "/blog/wordpress-blogging-tips-to-help-you-get-started", permanent: true },
      { source: "/wordpress-cloud-hosting-with-big-ambitions-on-cloudways", destination: "/blog/wordpress-cloud-hosting-with-big-ambitions-on-cloudways", permanent: true },
      { source: "/wp-engine-for-transformative-wordpress-hosting", destination: "/blog/wp-engine-for-transformative-wordpress-hosting", permanent: true },

      // --- Old WordPress category archives ---
      { source: "/category/:slug", destination: "/blog", permanent: true },
      { source: "/tag/:slug", destination: "/blog", permanent: true },
      { source: "/author/:slug", destination: "/blog", permanent: true },

      // --- Old WordPress pages from the 404 report ---
      { source: "/home", destination: "/", permanent: true },
      { source: "/blogs", destination: "/blog", permanent: true },
      { source: "/cookie-policy", destination: "/privacy-policy", permanent: true },
      // /services/aws-services is a live page — do not redirect it.
      { source: "/wordpress-multisite-development", destination: "/services/wordpress-development", permanent: true },
      { source: "/add-on-services/alexa-skills-development-services", destination: "/services", permanent: true },
      { source: "/amp-website-design", destination: "/services", permanent: true },
    ];
  },
  async rewrites() {
    return [
      {
        // IndexNow ownership file. app/llms.txt/route.ts takes precedence for /llms.txt.
        source: "/:key.txt",
        destination: "/api/indexnow-key?key=:key",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/_next/image",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy-Report-Only",
            value: cspDirectives,
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
