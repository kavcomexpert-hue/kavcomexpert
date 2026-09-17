"use client";

import { SeoAeoTable } from "@/components/admin/seo-aeo-table";
import { SeoAuditTable } from "@/components/admin/seo-audit-table";
import { SeoSitemapManager } from "@/components/admin/seo-sitemap-manager";
import { SeoSummaryCards } from "@/components/admin/seo-summary-cards";
import type { AeoPostRow } from "@/lib/seo/aeo-audit";
import type { SitemapAdminRow } from "@/lib/seo/sitemap-data";
import type { SeoAuditRow } from "@/lib/seo/audit";
import Link from "next/link";
import { useState } from "react";

type TabId = "health" | "sitemap" | "aeo";

type SeoAdminClientProps = {
  rows: SeoAuditRow[];
  summary: {
    totalIndexed: number;
    failing: number;
    stale: number;
    missingFaqs: number;
  };
  sitemapRows: SitemapAdminRow[];
  excludedPaths: string[];
  aeoRows: AeoPostRow[];
  homepageEditorHref: string;
};

export function SeoAdminClient({
  rows,
  summary,
  sitemapRows,
  excludedPaths,
  aeoRows,
  homepageEditorHref,
}: SeoAdminClientProps) {
  const [tab, setTab] = useState<TabId>("health");

  return (
    <div className="space-y-6">
      <div className="rounded-default border border-border bg-surface p-4 shadow-soft">
        <p className="text-sm font-medium text-foreground">Homepage SEO</p>
        <p className="mt-1 text-sm text-muted">
          Optimize meta title, description, focus keyword, and OG image for{" "}
          <span className="font-mono text-foreground">/</span>.
        </p>
        <Link
          href={homepageEditorHref}
          className="mt-3 inline-flex h-10 items-center justify-center rounded-default bg-accent px-4 text-sm font-medium text-surface transition-opacity hover:opacity-90"
        >
          Edit homepage SEO
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {(
          [
            { id: "health", label: "Health" },
            { id: "sitemap", label: "Sitemap" },
            { id: "aeo", label: "AEO" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === item.id
                ? "bg-accent text-surface"
                : "border border-border bg-background text-muted hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "health" ? (
        <div className="space-y-6">
          <SeoSummaryCards
            totalIndexed={summary.totalIndexed}
            failing={summary.failing}
            stale={summary.stale}
            missingFaqs={summary.missingFaqs}
          />
          <SeoAuditTable rows={rows} />
        </div>
      ) : null}

      {tab === "sitemap" ? (
        <SeoSitemapManager
          rows={sitemapRows}
          excludedPaths={excludedPaths}
        />
      ) : null}

      {tab === "aeo" ? (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Published posts missing TL;DR, takeaways, FAQs, or not updated in
            the last 12 months. Click a title to open the editor.
          </p>
          <SeoAeoTable rows={aeoRows} />
        </div>
      ) : null}
    </div>
  );
}
