import { getSiteSettings } from "@/lib/queries/site-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RETRY_AFTER_SECONDS = "3600";

const DEFAULT_TITLE = "We'll be right back";
const DEFAULT_BODY =
  "We're doing a little maintenance. Please check again shortly — thanks for your patience.";

export async function GET() {
  let orgName = "Kavcom Expert";
  let title = DEFAULT_TITLE;
  let body = DEFAULT_BODY;
  try {
    const settings = await getSiteSettings();
    orgName = settings.organizationName || orgName;
    title = settings.maintenanceTitle?.trim() || DEFAULT_TITLE;
    body = settings.maintenanceBody?.trim() || DEFAULT_BODY;
  } catch {
    // defaults
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex" />
  <title>${escapeHtml(title)} | ${escapeHtml(orgName)}</title>
  <style>
    :root {
      color-scheme: light dark;
      --bg: #f7f7f5;
      --fg: #111111;
      --muted: #6b6b6b;
      --accent: #1a5cff;
      --surface: #ffffff;
      --border: #e5e5e2;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0c0c0c;
        --fg: #f5f5f5;
        --muted: #a3a3a3;
        --accent: #6b9bff;
        --surface: #161616;
        --border: #2a2a2a;
      }
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 2rem;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: var(--bg);
      color: var(--fg);
    }
    main {
      width: min(100%, 32rem);
      text-align: center;
      padding: 2.5rem 1.75rem;
      border: 1px solid var(--border);
      border-radius: 16px;
      background: var(--surface);
    }
    p.eyebrow {
      margin: 0;
      font-size: 0.8125rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--accent);
    }
    h1 {
      margin: 0.85rem 0 0;
      font-size: clamp(1.75rem, 4vw, 2.25rem);
      font-weight: 650;
      letter-spacing: -0.03em;
      line-height: 1.15;
    }
    p.body {
      margin: 1rem 0 0;
      font-size: 1rem;
      line-height: 1.55;
      color: var(--muted);
    }
  </style>
</head>
<body>
  <main>
    <p class="eyebrow">${escapeHtml(orgName)}</p>
    <h1>${escapeHtml(title)}</h1>
    <p class="body">
      ${escapeHtml(body)}
    </p>
  </main>
</body>
</html>`;

  return new Response(html, {
    status: 503,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Retry-After": RETRY_AFTER_SECONDS,
      "Cache-Control": "no-store",
    },
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
