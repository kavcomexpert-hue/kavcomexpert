import { PageHeader } from "@/components/admin/page-header";
import { DashboardPanel } from "@/components/admin/dashboard-panel";
import { QuickDraftBox } from "@/components/admin/quick-draft-box";
import { requirePageSession } from "@/lib/admin/session";
import {
  canManageAllContent,
  canViewAuditLog,
  canViewLeads,
  sessionRole,
} from "@/lib/authz";
import {
  getDashboardStats,
  getGlanceCounts,
  getNeedsAttention,
  getRecentAuditActivity,
} from "@/lib/queries/admin-dashboard";
import Link from "next/link";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default async function AdminDashboardPage() {
  const session = await requirePageSession();
  const role = sessionRole(session);
  const showLeads = canViewLeads(session);
  const showPages = canManageAllContent(session);
  const showAudit = canViewAuditLog(session);

  const [stats, activity, glance, needsAttention] = await Promise.all([
    getDashboardStats(),
    showAudit ? getRecentAuditActivity(12) : Promise.resolve([]),
    getGlanceCounts(),
    getNeedsAttention(),
  ]);

  const statCards = [
    {
      label: "Published posts",
      value: stats.publishedPosts,
      href: "/admin/posts",
      visible: true,
    },
    {
      label: "Published pages",
      value: stats.publishedPages,
      href: "/admin/pages",
      visible: showPages,
    },
    {
      label: "Case studies",
      value: stats.publishedCaseStudies,
      href: "/admin/case-studies",
      visible: true,
    },
    {
      label: "New leads this week",
      value: stats.leadsThisWeek,
      href: "/admin/leads",
      visible: showLeads,
    },
  ].filter((card) => card.visible);

  const glanceItems = glance.filter((item) => {
    if (
      item.href === "/admin/pages" ||
      item.href === "/admin/services" ||
      item.href === "/admin/testimonials"
    ) {
      return showPages;
    }
    return true;
  });

  return (
    <>
      <PageHeader
        title="Dashboard"
        action={
          <Link
            href="/admin/posts/new"
            className="inline-flex h-9 items-center justify-center border border-transparent bg-accent px-4 text-sm font-medium text-surface transition-opacity hover:opacity-90"
          >
            New post
          </Link>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="border border-border bg-surface p-4 transition-colors hover:border-accent/40"
          >
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {card.value}
            </p>
          </Link>
        ))}
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          {showAudit ? (
            <DashboardPanel title="Recent activity" storageKey="activity">
              {activity.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted">
                  No activity yet.
                </p>
              ) : (
                <ul className="-mx-4 -my-4 divide-y divide-border">
                  {activity.map((row) => (
                    <li key={row.id} className="px-4 py-3 text-sm">
                      <p className="text-foreground">
                        <span className="font-medium">
                          {row.userName ?? row.userEmail ?? "System"}
                        </span>{" "}
                        <span className="text-muted">{row.action}</span>{" "}
                        <span className="font-mono text-xs text-accent">
                          {row.entityType}
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {row.createdAt
                          ? dateFormatter.format(row.createdAt)
                          : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </DashboardPanel>
          ) : (
            <DashboardPanel title="Welcome" storageKey="welcome">
              <p className="text-sm text-muted">
                Signed in as{" "}
                <span className="font-medium capitalize text-foreground">
                  {role}
                </span>
                . Use Posts and Case Studies to work on drafts
                {showPages
                  ? ", or browse site content from the sidebar"
                  : ""}
                .
              </p>
            </DashboardPanel>
          )}

          <DashboardPanel title="Quick draft" storageKey="quick-draft">
            <QuickDraftBox embedded />
          </DashboardPanel>
        </div>

        <div className="space-y-4">
          {needsAttention.length > 0 ? (
            <DashboardPanel title="Needs attention" storageKey="needs-attention">
              <ul className="space-y-2">
                {needsAttention.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="block border border-border bg-background px-3 py-2.5 transition-colors hover:border-accent/40"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-foreground">
                          {item.label}
                        </p>
                        <p className="font-mono text-sm font-semibold text-accent">
                          {item.count}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-muted">{item.detail}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </DashboardPanel>
          ) : null}

          <DashboardPanel title="At a glance" storageKey="glance">
            <div className="space-y-2">
              {glanceItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block border border-border bg-background px-3 py-2.5 transition-colors hover:border-accent/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">
                      {item.label}
                    </p>
                    <p className="font-mono text-[11px] text-muted">
                      {item.published} published
                    </p>
                  </div>
                  {(item.draft != null || item.scheduled != null) && (
                    <p className="mt-1 text-xs text-muted">
                      {item.draft != null ? `${item.draft} draft` : null}
                      {item.draft != null && item.scheduled != null
                        ? " · "
                        : null}
                      {item.scheduled != null
                        ? `${item.scheduled} scheduled`
                        : null}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </DashboardPanel>
        </div>
      </div>
    </>
  );
}
