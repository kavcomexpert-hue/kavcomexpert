"use client";

import { deleteApplication, updateApplicationStatus } from "@/actions/job-applications";
import { useToast } from "@/components/ui/toast";
import { ExternalLink, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ApplicationRow = {
  id: string;
  jobId: string;
  jobTitle?: string | null;
  name: string;
  email: string;
  phone: string | null;
  linkedinUrl: string | null;
  resumeUrl: string;
  resumeFilename: string | null;
  status: string;
  notes: string | null;
  createdAt: Date;
};

type ApplicationStatus = "new" | "reviewed" | "shortlisted" | "rejected" | "hired";

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "reviewed", label: "Reviewed" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "rejected", label: "Rejected" },
  { value: "hired", label: "Hired" },
];

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  new: "bg-background text-muted",
  reviewed: "bg-accent/10 text-accent",
  shortlisted: "bg-green-500/10 text-green-600 dark:text-green-400",
  rejected: "bg-danger/10 text-danger",
  hired: "bg-green-600/20 text-green-700 dark:text-green-300",
};

function StatusDropdown({
  id,
  currentStatus,
}: {
  id: string;
  currentStatus: string;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value as ApplicationStatus;
    setLoading(true);
    const result = await updateApplicationStatus(id, next);
    setLoading(false);
    if (!result.success) {
      toast(result.error, "error");
      return;
    }
    toast("Status updated");
    router.refresh();
  }

  return (
    <select
      value={currentStatus}
      onChange={(event) => void handleChange(event)}
      disabled={loading}
      className="rounded-default border border-border bg-background px-2 py-1.5 text-xs text-foreground focus-visible:ring-2 focus-visible:ring-accent"
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function DeleteButton({ id }: { id: string }) {
  const { toast } = useToast();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  if (confirming) {
    return (
      <span className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-xs text-muted hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            const result = await deleteApplication(id);
            setLoading(false);
            if (!result.success) {
              toast(result.error, "error");
              setConfirming(false);
              return;
            }
            toast("Application deleted");
            router.refresh();
          }}
          className="text-xs font-medium text-danger hover:opacity-80"
        >
          {loading ? "Deleting…" : "Confirm"}
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label="Delete application"
      className="text-muted hover:text-danger"
    >
      <Trash2 className="size-4" />
    </button>
  );
}

export function ApplicationsTable({
  items,
  showJobColumn = true,
}: {
  items: ApplicationRow[];
  showJobColumn?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-default border border-border bg-surface shadow-soft dark:shadow-glow">
      {items.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-muted">
          No applications yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-background">
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted">
                  Candidate
                </th>
                {showJobColumn ? (
                  <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted">
                    Role
                  </th>
                ) : null}
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted">
                  Resume
                </th>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted">
                  Status
                </th>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted">
                  Applied
                </th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-border last:border-b-0"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted">{item.email}</p>
                    {item.phone ? (
                      <p className="text-xs text-muted">{item.phone}</p>
                    ) : null}
                    {item.linkedinUrl ? (
                      <a
                        href={item.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-accent hover:opacity-80"
                      >
                        LinkedIn
                        <ExternalLink className="size-3" />
                      </a>
                    ) : null}
                  </td>
                  {showJobColumn ? (
                    <td className="px-4 py-3 text-muted">
                      {item.jobTitle ?? "—"}
                    </td>
                  ) : null}
                  <td className="px-4 py-3">
                    <a
                      href={item.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:opacity-80"
                    >
                      {item.resumeFilename ?? "Resume"}
                      <ExternalLink className="size-3" />
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`mb-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        STATUS_STYLES[item.status as ApplicationStatus] ??
                        "bg-background text-muted"
                      }`}
                    >
                      {STATUS_OPTIONS.find((o) => o.value === item.status)
                        ?.label ?? item.status}
                    </span>
                    <div className="mt-1">
                      <StatusDropdown
                        id={item.id}
                        currentStatus={item.status}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {item.createdAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <DeleteButton id={item.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
