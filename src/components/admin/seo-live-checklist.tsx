"use client";

import type { SeoCheckResult, SeoCheckStatus } from "@/lib/seo/audit";
import { Check, CircleAlert, X } from "lucide-react";

type SeoLiveChecklistProps = {
  checks: SeoCheckResult[];
};

function StatusIcon({ status }: { status: SeoCheckStatus }) {
  if (status === "pass") {
    return <Check className="size-4 text-success" aria-hidden="true" />;
  }

  if (status === "warn") {
    return <CircleAlert className="size-4 text-accent" aria-hidden="true" />;
  }

  return <X className="size-4 text-danger" aria-hidden="true" />;
}

export function SeoLiveChecklist({ checks }: SeoLiveChecklistProps) {
  return (
    <div className="space-y-3 rounded-default border border-border bg-background p-4">
      <div>
        <p className="font-mono text-xs uppercase tracking-wider text-muted">
          SEO checklist
        </p>
        <p className="mt-1 text-sm text-muted">
          Live checks against Kavcom publishing rules.
        </p>
      </div>

      <ul className="space-y-2">
        {checks.map((check) => (
          <li
            key={check.id}
            className="flex items-start gap-3 rounded-default border border-border px-3 py-2"
          >
            <StatusIcon status={check.status} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{check.label}</p>
              <p className="text-xs text-muted">{check.message}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
