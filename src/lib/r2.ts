import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** Strip trailing slashes so URL joins never produce `//` inside the path. */
function normalizePublicBase(raw: string): string {
  return raw.trim().replace(/\/+$/, "");
}

export const r2Bucket = requireEnv("R2_BUCKET");
export const r2PublicUrl = normalizePublicBase(requireEnv("R2_PUBLIC_URL"));

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${requireEnv("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
  },
});

export function getPublicUrl(key: string): string {
  const cleanKey = key.replace(/^\/+/, "");
  return `${r2PublicUrl}/${cleanKey}`;
}

export function getR2KeyFromUrl(url: string): string | null {
  const base = `${r2PublicUrl}/`;
  if (!url.startsWith(base)) {
    return null;
  }

  return url.slice(base.length).replace(/^\/+/, "") || null;
}

export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: r2Bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}

/** Confirm the object exists in the bucket via the private API (not the CDN). */
export async function assertObjectInR2(key: string): Promise<void> {
  try {
    await r2Client.send(
      new HeadObjectCommand({
        Bucket: r2Bucket,
        Key: key,
      }),
    );
  } catch (error) {
    const detail =
      error instanceof Error && error.message ? error.message : "unknown";
    throw new Error(
      `Upload to R2 did not persist (${detail}). Check R2 credentials and bucket name.`,
    );
  }
}

export async function deleteFromR2(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: r2Bucket,
      Key: key,
    }),
  );
}
