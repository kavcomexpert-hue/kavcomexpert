# Deploy (Hostinger VPS / Node)

This app is Next.js App Router with Drizzle + Neon, Better Auth, and R2 media.

## Prerequisites

1. Node.js 20+ on the VPS
2. Neon production database (not a dev branch)
3. Cloudflare R2 bucket + public URL
4. Resend API key for lead emails
5. Domain pointed at the VPS (HTTPS via Hostinger / Caddy / nginx)

## First-time setup

```bash
git clone <repo-url> kavcom-site
cd kavcom-site
npm ci
cp .env.production.example .env.production
# Fill every required value in .env.production (or the Hostinger env UI)
npx tsx scripts/preflight.ts
npm run db:migrate
npm run db:seed-admin   # once
npm run build
```

## Process manager (PM2)

```bash
npm i -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Ensure `NEXT_PUBLIC_SITE_URL`, `DATABASE_URL`, auth, R2, and Resend vars are available to the PM2 process (Hostinger env or `pm2 ecosystem` env_file).

## Updates

**Order matters:** migrate the production database **before** building when the release includes schema changes.

```bash
git pull
npm ci
npx tsx scripts/preflight.ts
export DATABASE_URL="postgresql://…your-prod-neon-url…"   # or use Hostinger env
npm run db:migrate:prod
npm run build
pm2 reload kavcom-site
```

For local/staging DB only, use `npm run db:migrate` instead.

## Notes

- Turnstile (optional): create a Cloudflare Turnstile widget with both the staging hostname and `kavcomexpert.com` listed, then set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` in production env. If either key is missing, lead forms skip Turnstile entirely.
- CSP is report-only in production headers (`Content-Security-Policy-Report-Only` in `next.config.ts`). Turnstile domains are already included for when you enforce CSP.
- After deploy, open `/admin/pages` once so system pages sync, and `/admin/content` / `/admin/popups` to confirm seeded rows.
- Sitemap and robots use `NEXT_PUBLIC_SITE_URL` (`src/lib/seo/constants.ts`).
- Production `npm run build` needs Neon reachability for full SSG. Public list/detail queries soft-fail to empty/null so a transient outage does not crash the whole build.
