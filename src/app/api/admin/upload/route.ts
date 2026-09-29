import { beginAdminMutation, RateLimitedError } from "@/lib/admin/mutation-guard";
import { canUseMedia } from "@/lib/authz";
import { processAndStoreUpload } from "@/lib/media/upload-core";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Allow large multipart bodies (Hostinger / Node pipeline). */
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const { audit, session } = await beginAdminMutation();
    if (!canUseMedia(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const altValue = formData.get("alt");
    const folderRaw = formData.get("folder");
    const folder =
      typeof folderRaw === "string" && folderRaw.trim()
        ? folderRaw.trim()
        : "uploads";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (typeof altValue !== "string") {
      return NextResponse.json(
        { error: "Alt text is required" },
        { status: 400 },
      );
    }

    const created = await processAndStoreUpload({
      file,
      alt: altValue,
      folder,
    });

    revalidatePath("/admin/media");

    await audit({
      action: "upload",
      entityType: "media",
      entityId: created.id,
      meta: { filename: created.filename, mimeType: created.mimeType },
    });

    return NextResponse.json({ success: true, media: created });
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }

    if (
      error instanceof Error &&
      (error.message === "Unauthorized" || error.message === "Forbidden")
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "Unauthorized" ? 401 : 403 },
      );
    }

    const message =
      error instanceof Error && error.message
        ? error.message
        : "Failed to upload file";

    const status =
      message.includes("150MB") ||
      message.includes("Unsupported") ||
      message.includes("Alt text") ||
      message.includes("label") ||
      message.includes("WebP") ||
      message.includes("R2_PUBLIC_URL") ||
      message.includes("did not persist") ||
      message.includes("Invalid media URL")
        ? 400
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
