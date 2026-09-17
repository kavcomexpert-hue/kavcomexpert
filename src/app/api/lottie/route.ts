import { NextResponse } from "next/server";

export const revalidate = 3600;

function looksLikeLottie(data: unknown): data is object {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;
  const record = data as Record<string, unknown>;
  return Array.isArray(record.layers) || typeof record.v === "string";
}

/**
 * Same-origin proxy for Lottie JSON stored on R2. The browser cannot
 * fetch() the public R2 URL directly (CORS), and inlining the JSON into
 * the RSC payload bloats service pages by up to ~1 MB.
 */
export async function GET(request: Request) {
  const src = new URL(request.url).searchParams.get("src")?.trim();
  const allowedOrigin = process.env.R2_PUBLIC_URL?.replace(/\/+$/, "");

  if (!src || !allowedOrigin || !src.startsWith(`${allowedOrigin}/`)) {
    return NextResponse.json({ error: "Invalid source" }, { status: 400 });
  }

  try {
    const res = await fetch(src, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Upstream error" }, { status: 502 });
    }

    const data: unknown = await res.json();
    if (!looksLikeLottie(data)) {
      return NextResponse.json({ error: "Not a Lottie document" }, { status: 422 });
    }

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
  }
}
