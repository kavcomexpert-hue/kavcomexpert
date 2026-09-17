import { resolveIndexNowKey } from "@/lib/indexnow/notify";
import { NextRequest, NextResponse } from "next/server";

/**
 * Serves the IndexNow ownership key at /{key}.txt via rewrite from next.config.
 */
export async function GET(request: NextRequest) {
  const requested = request.nextUrl.searchParams.get("key")?.trim();
  const expected = await resolveIndexNowKey();

  if (!expected || !requested || requested !== expected) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(expected, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
