"use client";

import { reorderJobs } from "@/actions/jobs";
import { useDragReorder } from "@/hooks/use-drag-reorder";
import { useToast } from "@/components/ui/toast";
import { GripVertical } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type JobRow = {
  id: string;
  slug: string;
  title: string;
  department: string | null;
  location: string | null;
  employmentType: string;
  status: string;
  sortOrder: number;
};

export function JobsTable({ items }: { items: JobRow[] }) {
  const { toast } = useToast();
  const router = useRouter();

  const { orderedItems, draggingId, handleDragStart, handleDragOver, handleDragEnd } =
    useDragReorder(items, async (orderedIds) => {
      const result = await reorderJobs(orderedIds);
      if (!result.success) {
        toast(result.error, "error");
        return;
      }
      toast("Order updated");
      router.refresh();
    });

  const EMPLOYMENT_LABELS: Record<string, string> = {
    "full-time": "Full-time",
    "part-time": "Part-time",
    contract: "Contract",
    remote: "Remote",
  };

  return (
    <div className="overflow-hidden rounded-default border border-border bg-surface shadow-soft dark:shadow-glow">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-background">
            <th className="w-10 px-3 py-3" />
            <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted">
              Title
            </th>
            <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted">
              Type
            </th>
            <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted">
              Location
            </th>
            <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted">
              Status
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
              <td className="px-3 py-3 text-muted">
                <GripVertical className="size-4 cursor-grab" aria-hidden="true" />
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/admin/jobs/${item.id}`}
                  className="font-medium text-foreground hover:text-accent"
                >
                  {item.title}
                </Link>
                {item.department ? (
                  <p className="text-xs text-muted">{item.department}</p>
                ) : null}
              </td>
              <td className="px-4 py-3 text-muted">
                {EMPLOYMENT_LABELS[item.employmentType] ?? item.employmentType}
              </td>
              <td className="px-4 py-3 text-muted">{item.location ?? "—"}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                    item.status === "published"
                      ? "bg-accent/10 text-accent"
                      : "bg-background text-muted"
                  }`}
                >
                  {item.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
