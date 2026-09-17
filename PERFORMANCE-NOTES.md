/*
 * PERFORMANCE NOTES — Kavcom Expert frontend
 *
 * Mobile LCP (homepage)
 * - LCP is the hero H1 text (no hero image). H1 paints immediately — no
 *   opacity:0 entrance animation on the headline.
 * - Lenis is skipped on mobile / coarse pointers; deferred on desktop idle.
 * - Chatbot, cookie consent, and popups mount after requestIdleCallback.
 * - YouTube testimonial posters are lazy (no priority).
 * - Below-fold homepage sections are code-split via next/dynamic.
 *
 * Agent / AI browsing
 * - /llms.txt + /llms-full + /feed.xml + /blog/{slug}/md
 * - robots.txt explicitly allows major AI crawlers
 * - sitemap includes llms endpoints; root metadata links text/plain llms.txt
 *
 * Hostinger / Node cold-start caveat
 * - On shared or always-sleep Hostinger Node plans, the first request after idle
 *   pays process boot + Next server start. Optimizing client JS does not remove
 *   that TTFB spike — keep PM2/keepalive or a warm ping if cold starts matter.
 */
