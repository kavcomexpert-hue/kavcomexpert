"use client";

import type { SeoAuditRow, SeoCheckId, SeoCheckStatus } from "@/lib/seo/audit";
import Link from "next/link";
import { useState } from "react";

const typeLabels = {
  post: "Post",
  page: "Page",
  service: "Service",
  "case-study": "Case study",
} as const;

function StatusDot({ status }: { status: SeoCheckStatus }) {
  const className =
    status === "pass"
      ? "bg-success"
      : status === "warn"
        ? "bg-accent"
        : "bg-danger";

  return (
    <span
      className={`inline-block size-2.5 rounded-full ${className}`}
      aria-hidden="true"
    />
  );
}

function OverallBadge({ status }: { status: SeoCheckStatus }) {
  const className =
    status === "pass"
      ? "border-success/30 bg-success/10 text-success"
      : status === "warn"
        ? "border-accent/30 bg-accent/10 text-accent"
        : "border-danger/30 bg-danger/10 text-danger";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${className}`}
    >
      {status}
    </span>
  );
}

type SeoAuditTableProps = {
  rows: SeoAuditRow[];
};

const checkColumns: { id: SeoCheckId; label: string }[] = [
  { id: "metaTitle", label: "Title" },
  { id: "metaDescription", label: "Description" },
  { id: "focusKeyword", label: "Keyword" },
  { id: "secondaryKeywords", label: "2nd KW" },
  { id: "keywordPlacement", label: "KW placement" },
  { id: "singleH1", label: "H1" },
  { id: "internalLink", label: "Internal link" },
  { id: "coverOrOgImage", label: "Image" },
  { id: "tldr", label: "TL;DR" },
  { id: "faqs", label: "FAQs" },
  { id: "wordCount", label: "Words" },
  { id: "freshness", label: "Fresh" },
];

export function SeoAuditTable({ rows }: SeoAuditTableProps) {
  const checkOrder = checkColumns.map((column) => column.id);
  const [typeFilter, setTypeFilter] = useState<
    "all" | SeoAuditRow["type"]
  >("all");

  const filtered =
    typeFilter === "all"
      ? rows
      : rows.filter((row) => row.type === typeFilter);

  const filters: { id: typeof typeFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "post", label: "Posts" },
    { id: "page", label: "Pages" },
    { id: "service", label: "Services" },
    { id: "case-study", label: "Case studies" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setTypeFilter(filter.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              typeFilter === filter.id
                ? "bg-accent text-surface"
                : "border border-border bg-background text-muted hover:text-foreground"
            }`}
          >
            {filter.label}
            {filter.id === "all"
              ? ` (${rows.length})`
              : ` (${rows.filter((r) => r.type === filter.id).length})`}
          </button>
        ))}
      </div>
    <div className="overflow-hidden rounded-default border border-border bg-surface shadow-soft dark:shadow-glow">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-background">
              <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted">
                Content
              </th>
              <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted">
                Type
              </th>
              <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted">
                Overall
              </th>
              {checkColumns.map((column) => (
                <th
                  key={column.id}
                  className="px-3 py-3 font-mono text-[10px] uppercase tracking-wider text-muted"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={14} className="px-4 py-10 text-center text-muted">
                  No published content to audit yet.
                </td>
              </tr>
            ) : (
              filtered.map((row) => {
                const checkMap = new Map(
                  row.checks.map((check) => [check.id, check.status]),
                );

                return (
                  <tr
                    key={`${row.type}-${row.id}`}
                    className="border-b border-border transition-colors last:border-b-0 hover:bg-background/60"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={row.editorHref}
                        className="block font-medium text-foreground transition-colors hover:text-accent"
                      >
                        {row.title}
                      </Link>
                      {!row.indexed ? (
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted">
                          noindex
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted">{typeLabels[row.type]}</td>
                    <td className="px-4 py-3">
                      <OverallBadge status={row.overallStatus} />
                    </td>
                    {checkOrder.map((checkId) => {
                      const status = checkMap.get(checkId);

                      return (
                        <td key={checkId} className="px-3 py-3 text-center">
                          {status ? (
                            <span className="inline-flex justify-center">
                              <StatusDot status={status} />
                              <span className="sr-only">{status}</span>
                            </span>
                          ) : (
                            <span className="text-muted">N/A</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
}
