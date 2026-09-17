"use client";

import {
  reorderTestimonials,
  toggleTestimonialFeatured,
} from "@/actions/testimonials";
import { useDragReorder } from "@/hooks/use-drag-reorder";
import { useToast } from "@/components/ui/toast";
import { GripVertical } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type TestimonialRow = {
  id: string;
  clientName: string;
  company: string | null;
  status: string | null;
  featured: boolean | null;
};

export function TestimonialsTable({ items }: { items: TestimonialRow[] }) {
  const { toast } = useToast();
  const router = useRouter();

  const { orderedItems, draggingId, handleDragStart, handleDragOver, handleDragEnd } =
    useDragReorder(items, async (orderedIds) => {
      const result = await reorderTestimonials(orderedIds);
      if (!result.success) {
        toast(result.error, "error");
        return;
      }
      toast("Order updated");
      router.refresh();
    });

  async function handleFeaturedToggle(id: string, featured: boolean) {
    const result = await toggleTestimonialFeatured(id, featured);
    if (!result.success) {
      toast(result.error, "error");
      return;
    }
    router.refresh();
  }

  return (
    <div className="overflow-hidden border border-border bg-surface">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-background">
            <th className="w-10 px-3 py-2.5" />
            <th className="px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider text-muted">
              Client
            </th>
            <th className="px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider text-muted">
              Status
            </th>
            <th className="px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider text-muted">
              Featured
            </th>
          </tr>
        </thead>
        <tbody>
          {orderedItems.map((item) => (
            <tr
              key={item.id}
              draggable
              onDragStart={() => handleDragStart(item.id)}
              onDragOver={(event) => handleDragOver(event, item.id)}
              onDragEnd={() => void handleDragEnd()}
              className={`border-b border-border last:border-b-0 ${
                draggingId === item.id ? "opacity-50" : ""
              }`}
            >
              <td className="px-3 py-2.5 text-muted">
                <GripVertical className="size-4 cursor-grab" aria-hidden="true" />
              </td>
              <td className="px-4 py-2.5">
                <Link
                  href={`/admin/testimonials/${item.id}`}
                  className="font-medium text-foreground hover:text-accent"
                >
                  {item.clientName}
                </Link>
                {item.company ? (
                  <p className="text-xs text-muted">{item.company}</p>
                ) : null}
              </td>
              <td className="px-4 py-2.5">
                <span
                  className={`inline-flex px-2 py-0.5 text-xs font-medium ${
                    item.status === "published"
                      ? "bg-accent/10 text-accent"
                      : "bg-background text-muted"
                  }`}
                >
                  {item.status ?? "draft"}
                </span>
              </td>
              <td className="px-4 py-3">
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(item.featured)}
                    onChange={(event) =>
                      void handleFeaturedToggle(item.id, event.target.checked)
                    }
                    className="size-4 rounded border-border text-accent focus:ring-accent"
                  />
                  <span className="text-xs text-muted">Featured</span>
                </label>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
