"use client";

import { togglePopupStatus } from "@/actions/popups";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";
import { useRouter } from "next/navigation";

type PopupRow = {
  id: string;
  name: string;
  status: string;
  type: string;
  priority: number;
  frequency: string;
};

export function PopupsTable({ items }: { items: PopupRow[] }) {
  const { toast } = useToast();
  const router = useRouter();

  async function handleToggle(id: string, next: "active" | "paused") {
    const result = await togglePopupStatus(id, next);
    if (!result.success) {
      toast(result.error, "error");
      return;
    }
    toast(next === "active" ? "Popup activated" : "Popup paused");
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <div className="rounded-default border border-border bg-surface p-8 text-center">
        <p className="text-sm text-muted">No popups yet.</p>
        <Link
          href="/admin/popups/new"
          className="mt-4 inline-flex h-10 items-center justify-center rounded-default bg-accent px-4 text-sm font-medium text-surface"
        >
          Create popup
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-border bg-surface">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-background">
            <th className="px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider text-muted">
              Name
            </th>
            <th className="px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider text-muted">
              Type
            </th>
            <th className="px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider text-muted">
              Priority
            </th>
            <th className="px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider text-muted">
              Frequency
            </th>
            <th className="px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider text-muted">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const isActive = item.status === "active";
            return (
              <tr key={item.id} className="border-b border-border last:border-b-0">
                <td className="px-4 py-2.5">
                  <Link
                    href={`/admin/popups/${item.id}`}
                    className="font-medium text-foreground hover:text-accent"
                  >
                    {item.name}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-muted">{item.type}</td>
                <td className="px-4 py-2.5 text-muted">{item.priority}</td>
                <td className="px-4 py-2.5 text-muted">{item.frequency}</td>
                <td className="px-4 py-3">
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(event) =>
                        void handleToggle(
                          item.id,
                          event.target.checked ? "active" : "paused",
                        )
                      }
                      className="size-4 rounded border-border text-accent focus:ring-accent"
                    />
                    <span
                      className={`text-xs font-medium ${
                        isActive ? "text-accent" : "text-muted"
                      }`}
                    >
                      {isActive ? "Active" : "Paused"}
                    </span>
                  </label>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
