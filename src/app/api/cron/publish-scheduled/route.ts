import { publishDueScheduledCaseStudies } from "@/lib/case-studies/publish-scheduled";
import { publishDueScheduledPages } from "@/lib/pages/publish-scheduled";
import { publishDueScheduledPosts } from "@/lib/posts/publish-scheduled";
import { publishDueScheduledServices } from "@/lib/services/publish-scheduled";
import { NextRequest, NextResponse } from "next/server";

/**
 * Secret-protected scheduled publish sweep for Hostinger / external cron.
 * GET or POST with header: Authorization: Bearer $CRON_SECRET
 * or query ?secret=$CRON_SECRET
 */
export async function GET(request: NextRequest) {
  return run(request);
}

export async function POST(request: NextRequest) {
  return run(request);
}

async function run(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 503 },
    );
  }

  const authHeader = request.headers.get("authorization");
  const bearer =
    authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  const querySecret = request.nextUrl.searchParams.get("secret");
  const provided = bearer || querySecret;

  if (!provided || provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [postsPublished, pagesPublished, caseStudiesPublished, servicesPublished] =
      await Promise.all([
        publishDueScheduledPosts(),
        publishDueScheduledPages(),
        publishDueScheduledCaseStudies(),
        publishDueScheduledServices(),
      ]);
    return NextResponse.json({
      ok: true,
      published: postsPublished,
      pagesPublished,
      caseStudiesPublished,
      servicesPublished,
    });
  } catch (error) {
    console.error("[cron/publish-scheduled]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
