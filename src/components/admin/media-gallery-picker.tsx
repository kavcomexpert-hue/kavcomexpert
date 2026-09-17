"use client";

import { MediaPicker } from "@/components/admin/media-picker";

export type GalleryItem = {
  url: string;
  alt?: string;
};

type MediaGalleryPickerProps = {
  open: boolean;
  onClose: () => void;
  selected: GalleryItem[];
  onChange: (items: GalleryItem[]) => void;
};

export function MediaGalleryPicker({
  open,
  onClose,
  selected,
  onChange,
}: MediaGalleryPickerProps) {
  return (
    <MediaPicker
      open={open}
      onClose={onClose}
      mode="multi"
      selectedUrls={selected.map((item) => item.url)}
      onSelectMany={(items) => {
        onChange(items.map((item) => ({ url: item.url, alt: item.alt })));
      }}
    />
  );
}
