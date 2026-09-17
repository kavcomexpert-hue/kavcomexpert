import { auth } from "@/lib/auth";
import {
  contentExportFilename,
  createContentExportStream,
} from "@/lib/admin/content-export";
import { parseAppRole } from "@/lib/authz";
import { headers } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const role = parseAppRole(
    (session.user as { role?: string | null }).role,
  );
  if (role !== "admin") {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const suspended = Boolean(
    (session.user as { suspended?: boolean | null }).suspended,
  );
  if (suspended) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const filename = contentExportFilename();
  const stream = await createContentExportStream();

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
