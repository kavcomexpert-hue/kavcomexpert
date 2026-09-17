import type { TestimonialVideo } from "@/components/site/testimonial-videos";
import {
  extractYoutubeId,
  youtubePosterUrl,
} from "@/lib/site/video-embed";

export { extractYoutubeId } from "@/lib/site/video-embed";

/**
 * Map a CMS videoUrl into the shape the video slider already expects.
 * Supports YouTube watch/embed/short links and direct media URLs.
 */
export function mapVideoUrlToTestimonialVideo(input: {
  id: string;
  clientName: string;
  company: string | null;
  videoUrl: string;
  headshot?: string | null;
}): TestimonialVideo | null {
  const url = input.videoUrl.trim();
  if (!url) return null;

  const youtubeId = extractYoutubeId(url);

  if (youtubeId) {
    return {
      id: input.id,
      name: input.clientName,
      company: input.company?.trim() || "Client",
      youtubeId,
      // Always prefer the YouTube thumbnail for the facade so first paint is
      // stable and does not depend on an optional (often broken) headshot.
      posterSrc: youtubePosterUrl(youtubeId),
    };
  }

  return {
    id: input.id,
    name: input.clientName,
    company: input.company?.trim() || "Client",
    videoSrc: url,
    posterSrc: input.headshot?.trim() || undefined,
  };
}
