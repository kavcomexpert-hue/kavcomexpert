export function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

export type FaqItem = {
  question: string;
  answer: string;
};

export function parseFaqs(value: unknown): FaqItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (
      item &&
      typeof item === "object" &&
      "question" in item &&
      "answer" in item &&
      typeof item.question === "string" &&
      typeof item.answer === "string"
    ) {
      return [{ question: item.question, answer: item.answer }];
    }

    return [];
  });
}

export type GalleryItem = {
  url: string;
  alt: string;
  kind: "image" | "video";
};

const VIDEO_EXT = /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i;

export function isVideoUrl(url: string): boolean {
  const lower = url.toLowerCase();
  if (VIDEO_EXT.test(lower)) return true;
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return true;
  if (lower.includes("vimeo.com")) return true;
  return false;
}

export function parseGallery(value: unknown): GalleryItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (
      item &&
      typeof item === "object" &&
      "url" in item &&
      typeof item.url === "string"
    ) {
      const url = item.url;
      return [
        {
          url,
          alt: "alt" in item && typeof item.alt === "string" ? item.alt : "",
          kind: isVideoUrl(url) ? "video" : "image",
        },
      ];
    }

    return [];
  });
}
