"use client";

import {
  addWorkGalleryItem,
  deleteWorkGalleryItem,
  moveWorkGalleryItem,
  updateWorkGalleryItem,
} from "@/actions/work-gallery";
import { MediaPicker } from "@/components/admin/media-picker";
import { useToast } from "@/components/ui/toast";
import type { WorkGalleryItem } from "@/lib/queries/work-gallery";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

type WorkGalleryManagerProps = {
  items: WorkGalleryItem[];
};

export function WorkGalleryManager({ items: initialItems }: WorkGalleryManagerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState(initialItems);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleAdd(url: string) {
    setPickerOpen(false);
    const result = await addWorkGalleryItem({ url, alt: "" });
    if (!result.success) {
      toast(result.error, "error");
      return;
    }
    toast("Image added");
    router.refresh();
  }

  async function handleAltChange(id: string, alt: string) {
    const item = items.find((row) => row.id === id);
    if (!item) return;

    setItems((current) =>
      current.map((row) => (row.id === id ? { ...row, alt } : row)),
    );

    const result = await updateWorkGalleryItem({ id, url: item.url, alt });
    if (!result.success) {
      toast(result.error, "error");
      router.refresh();
    }
  }

  async function handleDelete(id: string) {
    setPendingId(id);
    const result = await deleteWorkGalleryItem(id);
    setPendingId(null);
    if (!result.success) {
      toast(result.error, "error");
      return;
    }
    toast("Image removed");
    setItems((current) => current.filter((row) => row.id !== id));
    router.refresh();
  }

  async function handleMove(id: string, direction: "up" | "down") {
    setPendingId(id);
    const result = await moveWorkGalleryItem(id, direction);
    setPendingId(null);
    if (!result.success) {
      toast(result.error, "error");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Images appear in the General Gallery on the Work page.
        </p>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="inline-flex h-11 items-center justify-center rounded-default bg-accent px-5 text-sm font-medium text-surface"
        >
          Add image
        </button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-default border border-border bg-surface p-8 text-center text-sm text-muted">
          No gallery images yet. Add one from the media library.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li
              key={item.id}
              className="flex flex-col gap-4 rounded-default border border-border bg-surface p-4 shadow-soft sm:flex-row sm:items-center"
            >
              <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-default border border-border bg-background sm:w-36">
                <Image
                  src={item.url}
                  alt={item.alt || "Gallery preview"}
                  fill
                  sizes="144px"
                  className="object-contain"
                />
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Alt text
                  <input
                    value={item.alt}
                    onChange={(event) =>
                      void handleAltChange(item.id, event.target.value)
                    }
                    className="mt-1 w-full rounded-default border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    placeholder="Describe this image"
                  />
                </label>
                <p className="truncate font-mono text-xs text-muted">{item.url}</p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  disabled={index === 0 || pendingId === item.id}
                  onClick={() => void handleMove(item.id, "up")}
                  aria-label="Move up"
                  className="inline-flex size-10 items-center justify-center rounded-default border border-border text-foreground transition-colors hover:border-accent disabled:opacity-35"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={index === items.length - 1 || pendingId === item.id}
                  onClick={() => void handleMove(item.id, "down")}
                  aria-label="Move down"
                  className="inline-flex size-10 items-center justify-center rounded-default border border-border text-foreground transition-colors hover:border-accent disabled:opacity-35"
                >
                  ↓
                </button>
                <button
                  type="button"
                  disabled={pendingId === item.id}
                  onClick={() => void handleDelete(item.id)}
                  className="inline-flex h-10 items-center justify-center rounded-default border border-danger/30 px-4 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => void handleAdd(url)}
      />
    </div>
  );
}
