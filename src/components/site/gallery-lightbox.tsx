"use client";

import { MediaPreviewModal } from "@/components/site/media-preview-modal";
import type { GalleryItem } from "@/lib/site/content-parsers";

type GalleryLightboxProps = {
  items: GalleryItem[];
  initialIndex: number;
  onClose: () => void;
  clientName?: string;
};

export function GalleryLightbox({
  items,
  initialIndex,
  onClose,
  clientName = "Gallery",
}: GalleryLightboxProps) {
  return (
    <MediaPreviewModal
      items={items}
      initialIndex={initialIndex}
      onClose={onClose}
      title={clientName}
    />
  );
}
