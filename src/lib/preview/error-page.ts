import { NextResponse } from "next/server";

/**
 * Admin-friendly HTML error for Draft Mode / preview failures.
 * Plain-text 4xx responses are hard to read in a new tab opened from admin.
 */
export function previewErrorResponse(
  title: string,
  message: string,
  status: number,
): NextResponse {
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex,nofollow" />
  <title>${safeTitle} · Preview</title>
  <style>
    :root { color-scheme: light dark; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif;
      background: Canvas;
      color: CanvasText;
    }
    main {
      max-width: 32rem;
      width: 100%;
      border: 1px solid color-mix(in srgb, CanvasText 18%, transparent);
      border-radius: 12px;
      padding: 28px;
      box-shadow: 0 8px 24px color-mix(in srgb, CanvasText 8%, transparent);
    }
    h1 { margin: 0 0 8px; font-size: 1.25rem; font-weight: 600; }
    p { margin: 0; line-height: 1.5; opacity: 0.8; font-size: 0.95rem; }
    .hint { margin-top: 16px; font-size: 0.85rem; opacity: 0.65; }
    a {
      display: inline-flex;
      margin-top: 20px;
      color: inherit;
      font-size: 0.9rem;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <main>
    <h1>${safeTitle}</h1>
    <p>${safeMessage}</p>
    <p class="hint">Draft preview links expire after one hour. Open Preview again from the admin editor.</p>
    <a href="/admin">← Back to admin</a>
  </main>
</body>
</html>`;

  return new NextResponse(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
