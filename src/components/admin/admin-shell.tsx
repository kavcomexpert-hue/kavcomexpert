"use client";

import { AdminGlobalSearch } from "@/components/admin/admin-global-search";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { ToastProvider } from "@/components/ui/toast";
import type { AppRole } from "@/lib/authz";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

type AdminShellProps = {
  userEmail: string;
  role: AppRole;
  maintenanceMode?: boolean;
  children: React.ReactNode;
};

export function AdminShell({
  userEmail,
  role,
  maintenanceMode = false,
  children,
}: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background">
        {maintenanceMode ? (
          <div className="border-b border-border bg-accent px-4 py-2 text-center text-sm font-medium text-surface">
            Maintenance mode is ON — public visitors see the temporary page.{" "}
            <Link
              href="/admin/settings"
              className="underline underline-offset-2 hover:opacity-90"
            >
              Settings
            </Link>
          </div>
        ) : null}

        <div className="flex min-h-screen lg:grid lg:grid-cols-[200px_minmax(0,1fr)]">
          <aside className="hidden w-[200px] shrink-0 border-r border-border bg-surface lg:sticky lg:top-0 lg:block lg:h-screen lg:overflow-hidden">
            <AdminSidebar userEmail={userEmail} role={role} />
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-2.5">
              <p className="shrink-0 text-sm font-semibold tracking-tight text-foreground lg:hidden">
                Kavcom Expert
              </p>
              <div className="flex min-w-0 flex-1 justify-end lg:justify-start">
                <AdminGlobalSearch />
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation menu"
                className="inline-flex size-8 shrink-0 items-center justify-center border border-border bg-background text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:hidden"
              >
                <Menu className="size-4" aria-hidden="true" />
              </button>
            </header>

            <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6">
              <div className="mx-auto w-full max-w-[1200px]">{children}</div>
            </main>
          </div>
        </div>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close navigation menu"
              className="absolute inset-0 bg-foreground/20"
              onClick={closeMobile}
            />
            <aside className="relative flex h-full w-[min(100%,240px)] flex-col border-r border-border bg-surface">
              <div className="flex items-center justify-end border-b border-border px-2 py-2">
                <button
                  type="button"
                  onClick={closeMobile}
                  aria-label="Close menu"
                  className="inline-flex size-8 items-center justify-center border border-border bg-background text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
              <AdminSidebar
                userEmail={userEmail}
                role={role}
                onNavigate={closeMobile}
              />
            </aside>
          </div>
        ) : null}
      </div>
    </ToastProvider>
  );
}
