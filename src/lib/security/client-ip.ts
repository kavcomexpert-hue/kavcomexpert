import { headers } from "next/headers";

export async function getClientIp(): Promise<string> {
  const h = await headers();

  const cfIp = h.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;

  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = h.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
}
