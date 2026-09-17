import { auth } from "@/lib/auth";
import { hasSessionCookie } from "@/lib/auth/has-session-cookie";
import { toNextJsHandler } from "better-auth/next-js";
import { cookies } from "next/headers";

const handler = toNextJsHandler(auth);

/**
 * Anonymous get-session: return null without entering Better Auth.
 * Defense in depth — callers should not hit this, but bots/misconfigs might.
 */
async function anonymousGetSessionResponse(
  request: Request,
): Promise<Response | null> {
  const path = new URL(request.url).pathname;
  if (!path.endsWith("/get-session")) return null;

  const jar = await cookies();
  if (hasSessionCookie(jar)) return null;

  return Response.json(null, {
    headers: {
      "cache-control": "no-store",
      pragma: "no-cache",
    },
  });
}

export async function GET(request: Request) {
  const early = await anonymousGetSessionResponse(request);
  if (early) return early;
  return handler.GET(request);
}

export async function POST(request: Request) {
  return handler.POST(request);
}
