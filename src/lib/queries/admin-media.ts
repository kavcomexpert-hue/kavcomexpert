import { getDb } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function getAdminMedia() {
  return getDb()
    .select({
      id: media.id,
      url: media.url,
      alt: media.alt,
      width: media.width,
      height: media.height,
      mimeType: media.mimeType,
      filename: media.filename,
      sizeBytes: media.sizeBytes,
      folder: media.folder,
      createdAt: media.createdAt,
    })
    .from(media)
    .orderBy(desc(media.createdAt));
}
