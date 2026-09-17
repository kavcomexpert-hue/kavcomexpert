# Kavcom Expert

Next.js marketing site and admin CMS for Kavcom Expert.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful scripts:

- `npm run db:migrate` — apply Drizzle migrations (local / dev `DATABASE_URL`)
- `npm run db:migrate:prod` — apply migrations to production (set `DATABASE_URL` to your Neon **production** connection string first)
- `npm run db:seed-admin` — create the initial admin user
- `npm run build` / `npm start` — production

## Database migrations (required before deploy)

If a deploy changes `src/lib/db/schema.ts`, **run migrations against production before `npm run build` on the host**. A schema mismatch (e.g. missing `services.hero_visual`) causes Postgres error `42703` during static page generation.

```bash
# Point at production Neon (run locally or on the VPS — not from CI unless intended)
export DATABASE_URL="postgresql://…your-prod-neon-url…"
npm run db:migrate:prod
```

Then deploy and build. See `deploy.md` for the full release order.

## SECURITY

### Secrets rotation

Rotate these whenever someone with access leaves, a secret may have leaked, or on a regular schedule (at least every 90 days for production):

1. **`BETTER_AUTH_SECRET`** — generate a new long random value, update the host env, redeploy, then sign in again (existing sessions invalidate).
2. **Database URL (`DATABASE_URL` / Neon)** — rotate the Neon role password in the Neon console, update env, redeploy.
3. **R2 / S3 credentials** (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`) — create a new API token in Cloudflare, update env, revoke the old token.
4. **`RESEND_API_KEY`** — create a new key in Resend, update env, delete the old key.
5. **`INDEXNOW_KEY`** — generate a new key, run `npm run indexnow:setup`, update search engine registrations if needed.
6. **`NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_CLARITY_ID`** — not secret, but rotate property access in Google/Microsoft admin if staff change.

Never commit `.env` files. Prefer host-level env vars (Hostinger / VPS) over files on disk.

### npm and sudo

**Never run any `npm` (or `npx`, `yarn`, `pnpm`) command with `sudo`.** Installing packages as root creates root-owned `node_modules`, breaks permissions, and is a security risk. Fix ownership with your user account instead, for example:

```bash
sudo chown -R "$(whoami)" node_modules
```

Then re-run `npm install` without sudo.

### Auth and 2FA

Admin sign-up is disabled. Enable TOTP 2FA under **Admin → Security**. Keep backup codes offline. Use **Sign out everywhere** after a suspected compromise.
