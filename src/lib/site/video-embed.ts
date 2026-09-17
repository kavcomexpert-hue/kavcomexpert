export function extractYoutubeId(url: string): string | null {
  try {
    const parsed = new URL(url);

    if (
      parsed.hostname === "youtu.be" ||
      parsed.hostname.endsWith(".youtu.be")
    ) {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id || null;
    }

    if (
      parsed.hostname.includes("youtube.com") ||
      parsed.hostname.includes("youtube-nocookie.com")
    ) {
      const fromQuery = parsed.searchParams.get("v");
      if (fromQuery) return fromQuery;

      const parts = parsed.pathname.split("/").filter(Boolean);
      const embedIndex = parts.findIndex(
        (part) => part === "embed" || part === "shorts" || part === "live",
      );
      if (embedIndex >= 0 && parts[embedIndex + 1]) {
        return parts[embedIndex + 1];
      }
    }
  } catch {
    // Fall through for bare IDs
  }

  if (/^[\w-]{11}$/.test(url)) {
    return url;
  }

  return null;
}

export function youtubePosterUrl(youtubeId: string): string {
  return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
}

/** Embed params. Autoplay is OFF by default so poster/thumb embeds stay quiet. */
export function youtubeEmbedSrc(
  youtubeId: string,
  options?: { autoplay?: boolean },
): string {
  const autoplay = options?.autoplay ? 1 : 0;
  const params = new URLSearchParams({
    autoplay: String(autoplay),
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    fs: "0",
  });
  return `https://www.youtube-nocookie.com/embed/${youtubeId}?${params.toString()}`;
}

export const YOUTUBE_IFRAME_ALLOW =
  "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";

/**
 * Convert a watch / share URL into an in-page embed URL.
 * YouTube embeds always disable fullscreen (`fs=0`).
 * Pass `{ autoplay: true }` only for modal players opened by user gesture.
 */
export function toEmbedUrl(url: string, options?: { autoplay?: boolean }): string {
  const youtubeId = extractYoutubeId(url);
  if (youtubeId) {
    return youtubeEmbedSrc(youtubeId, options);
  }

  const lower = url.toLowerCase();
  if (lower.includes("vimeo.com/")) {
    const id = url.split("vimeo.com/")[1]?.split(/[?&]/)[0];
    if (!id) return url;
    const autoplay = options?.autoplay ? 1 : 0;
    return `https://player.vimeo.com/video/${id}?autoplay=${autoplay}`;
  }

  return url;
}

export function isEmbeddableVideoUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes("youtube.com") ||
    lower.includes("youtu.be") ||
    lower.includes("youtube-nocookie.com") ||
    lower.includes("vimeo.com")
  );
}
