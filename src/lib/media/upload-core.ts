import { getDb } from "@/lib/db";
import { media } from "@/lib/db/schema";
import {
  assertObjectInR2,
  deleteFromR2,
  getPublicUrl,
  uploadToR2,
} from "@/lib/r2";
import { createHash } from "node:crypto";
import path from "node:path";
import sharp from "sharp";
import { maybeStripLottieBackground } from "@/lib/media/strip-lottie-bg";

export const MAX_UPLOAD_BYTES = 150 * 1024 * 1024;

export const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
  "image/heic",
  "image/heif",
]);

const DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/json",
  "text/json",
  "text/plain",
  "text/csv",
]);

const VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const AUDIO_MIME_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
  "audio/webm",
]);

export const ALLOWED_MIME_TYPES = new Set([
  ...IMAGE_MIME_TYPES,
  ...DOCUMENT_MIME_TYPES,
  ...VIDEO_MIME_TYPES,
  ...AUDIO_MIME_TYPES,
]);

/** Raster formats that must become webp q82 (gif/svg left alone). */
const RASTER_TO_WEBP = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
]);

export type UploadedMediaRow = {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
  alt: string;
  mimeType: string | null;
  filename: string | null;
  sizeBytes: number | null;
  folder: string | null;
};

function extensionForMime(mime: string, originalName: string): string {
  const fromName = path.extname(originalName).replace(".", "").toLowerCase();
  if (fromName) return fromName;

  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
    "image/gif": "gif",
    "image/svg+xml": "svg",
    "image/heic": "heic",
    "image/heif": "heif",
    "application/pdf": "pdf",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/ogg": "ogg",
    "text/plain": "txt",
    "text/csv": "csv",
    "application/json": "json",
    "text/json": "json",
  };

  return map[mime] ?? "bin";
}

function sniffMimeFromName(name: string): string | null {
  const ext = path.extname(name).replace(".", "").toLowerCase();
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    avif: "image/avif",
    gif: "image/gif",
    svg: "image/svg+xml",
    heic: "image/heic",
    heif: "image/heif",
    pdf: "application/pdf",
    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    txt: "text/plain",
    csv: "text/csv",
    json: "application/json",
  };
  return map[ext] ?? null;
}

function normalizeMime(raw: string): string {
  const mime = raw.trim().toLowerCase();
  if (mime === "image/jpg") return "image/jpeg";
  if (mime === "text/json") return "application/json";
  return mime;
}

function assertPublicMediaUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(
      "Invalid media URL generated. Check R2_PUBLIC_URL is a full https origin.",
    );
  }

  if (parsed.protocol !== "https:") {
    throw new Error("Media URL must use https. Check R2_PUBLIC_URL.");
  }

  if (parsed.hostname.includes("r2.cloudflarestorage.com")) {
    throw new Error(
      "R2_PUBLIC_URL points at the private S3 API endpoint. Use your public R2 custom domain or pub-*.r2.dev URL instead.",
    );
  }

  if (
    url.includes("//media/") ||
    /[^:]\/{2,}/.test(url.replace(/^https?:\/\//, ""))
  ) {
    throw new Error(
      "Media URL has a malformed path (double slash). Check R2_PUBLIC_URL has no trailing slash issues.",
    );
  }
}

/**
 * Soft CDN probe from the app server. Never blocks insert — Hostinger and other
 * hosts often cannot HEAD public r2.dev URLs even when browsers can load them.
 */
async function softProbePublicUrl(url: string): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
    }
    try {
      const head = await fetch(url, { method: "HEAD", redirect: "follow" });
      if (head.ok) return;
      const get = await fetch(url, {
        method: "GET",
        headers: { Range: "bytes=0-0" },
        redirect: "follow",
      });
      if (get.ok || get.status === 206) return;
    } catch {
      /* retry */
    }
  }
  console.warn(
    `[media] public CDN probe did not confirm reachability (object is in R2). URL: ${url}`,
  );
}

/**
 * Process one uploaded file: validate, convert rasters to webp q82,
 * put to R2, confirm via HeadObject, insert media row.
 * Throws Error with a user-facing message on failure — never inserts a broken row.
 */
export async function processAndStoreUpload(input: {
  file: File;
  alt: string;
  folder?: string;
}): Promise<UploadedMediaRow> {
  const { file } = input;
  const alt = input.alt.trim();
  const folder = (input.folder?.trim() || "uploads").slice(0, 120);

  if (!alt) {
    throw new Error(
      IMAGE_MIME_TYPES.has(normalizeMime(file.type)) ||
        sniffMimeFromName(file.name)?.startsWith("image/")
        ? "Alt text is required"
        : "A label / description is required",
    );
  }

  const sniffed = sniffMimeFromName(file.name);
  const contentTypeIn = normalizeMime(file.type || sniffed || "");

  if (!contentTypeIn || !ALLOWED_MIME_TYPES.has(contentTypeIn)) {
    throw new Error(
      "Unsupported file type. Upload images (PNG, JPEG, WebP, AVIF, GIF, SVG), Lottie JSON, PDF/docs, audio, or video (MP4, WebM, MOV).",
    );
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Files must be 150MB or smaller");
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());
  let outputBuffer: Buffer = inputBuffer;
  let extension = extensionForMime(contentTypeIn, file.name);
  let contentType = contentTypeIn;
  let width: number | null = null;
  let height: number | null = null;
  const isImage = IMAGE_MIME_TYPES.has(contentTypeIn);
  let r2Key: string | null = null;
  let uploaded = false;

  try {
    if (
      contentTypeIn === "application/json" ||
      extension === "json" ||
      file.name.toLowerCase().endsWith(".json")
    ) {
      outputBuffer = maybeStripLottieBackground(inputBuffer);
      extension = "json";
      contentType = "application/json";
    } else if (RASTER_TO_WEBP.has(contentTypeIn)) {
      try {
        const converted = await sharp(inputBuffer)
          .rotate()
          .webp({ quality: 82 })
          .toBuffer({ resolveWithObject: true });

        outputBuffer = converted.data;
        width = converted.info.width;
        height = converted.info.height;
        extension = "webp";
        contentType = "image/webp";
      } catch (error) {
        const detail =
          error instanceof Error && error.message
            ? error.message
            : "unknown sharp error";
        throw new Error(
          `Image conversion to WebP failed (${detail}). Try another file or re-export as JPG/PNG.`,
        );
      }
    } else if (isImage && contentTypeIn === "image/gif") {
      try {
        const metadata = await sharp(inputBuffer, { animated: true }).metadata();
        width = metadata.width ?? null;
        height = metadata.height ?? null;
      } catch {
        /* gif edge cases — keep original bytes */
      }
    }

    const hash = createHash("sha256")
      .update(outputBuffer)
      .digest("hex")
      .slice(0, 24);
    r2Key = `media/${hash}.${extension}`;

    await uploadToR2(r2Key, outputBuffer, contentType);
    uploaded = true;
    await assertObjectInR2(r2Key);

    const url = getPublicUrl(r2Key);
    assertPublicMediaUrl(url);
    await softProbePublicUrl(url);

    const filename = file.name.slice(0, 180);

    const [created] = await getDb()
      .insert(media)
      .values({
        url,
        alt,
        width,
        height,
        mimeType: contentType,
        filename,
        sizeBytes: outputBuffer.length,
        folder,
      })
      .returning({
        id: media.id,
        url: media.url,
        width: media.width,
        height: media.height,
        alt: media.alt,
        mimeType: media.mimeType,
        filename: media.filename,
        sizeBytes: media.sizeBytes,
        folder: media.folder,
      });

    return created;
  } catch (error) {
    if (r2Key && uploaded) {
      try {
        await deleteFromR2(r2Key);
      } catch {
        /* best-effort cleanup */
      }
    }
    throw error;
  }
}
