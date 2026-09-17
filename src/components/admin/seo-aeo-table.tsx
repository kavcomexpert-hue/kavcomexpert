"use client";

import type { AeoPostFlag, AeoPostRow } from "@/lib/seo/aeo-audit";
import Link from "next/link";

const flagLabels: Record<AeoPostFlag, string> = {
  missing_tldr: "Missing TL;DR",
  missing_takeaways: "Missing takeaways",
  missing_faqs: "Missing FAQs",
  stale: "Not updated in 12 months",
};

type SeoAeoTableProps = {
  rows: AeoPostRow[];
};

export function SeoAeoTable({ rows }: SeoAeoTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-default border border-border bg-surface p-8 text-center shadow-soft dark:shadow-glow">
        <p className="font-display text-lg font-semibold text-foreground">
          All published posts look AEO-ready
        </p>
        <p className="mt-2 text-sm text-muted">
          No missing TL;DR, takeaways, FAQs, or stale updates in the last 12
          months.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-default border border-border bg-surface shadow-soft dark:shadow-glow">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-background">
              <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted">
                Post
              </th>
              <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted">
                Updated
              </th>
              <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted">
                Flags
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border last:border-b-0"
              >
                <td className="px-4 py-3">
                  <Link
                    href={row.editorHref}
                    className="font-medium text-foreground transition-colors hover:text-accent"
                  >
                    {row.title}
                  </Link>
                  <p className="mt-1 font-mono text-xs text-muted">
                    /blog/{row.slug}
                  </p>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted">
                  {row.updatedAt
                    ? row.updatedAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <ul className="flex flex-wrap gap-2">
                    {row.flags.map((flag) => (
                      <li
                        key={flag}
                        className="rounded-full border border-danger/30 bg-danger/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-danger"
                      >
                        {flagLabels[flag]}
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
