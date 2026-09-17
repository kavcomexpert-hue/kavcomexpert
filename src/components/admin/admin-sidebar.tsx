"use client";

import { navItemsForRole, type AdminNavItem } from "@/components/admin/admin-nav";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { AppRole } from "@/lib/authz";
import Link from "next/link";
import { usePathname } from "next/navigation";

type AdminSidebarProps = {
  userEmail: string;
  role: AppRole;
  onNavigate?: () => void;
};

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  item,
  pathname,
  onNavigate,
  nested = false,
}: {
  item: AdminNavItem;
  pathname: string;
  onNavigate?: () => void;
  nested?: boolean;
}) {
  const active = isActivePath(pathname, item.href);
  const Icon = item.icon;
  const childActive = item.children?.some((child) =>
    isActivePath(pathname, child.href),
  );

  return (
    <div>
      <Link
        href={item.href}
        onClick={onNavigate}
        className={`flex items-center gap-2 border-l-2 py-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
          nested ? "pl-8 pr-3" : "pl-3 pr-3"
        } ${
          active
            ? "border-accent bg-background font-medium text-foreground"
            : childActive
              ? "border-transparent font-medium text-foreground"
              : "border-transparent text-muted hover:bg-background hover:text-foreground"
        }`}
      >
        <Icon className="size-3.5 shrink-0 opacity-80" aria-hidden="true" />
        {item.label}
      </Link>
      {item.children?.length ? (
        <div className="mt-0.5 space-y-0.5">
          {item.children.map((child) => (
            <NavLink
              key={child.href}
              item={child}
              pathname={pathname}
              onNavigate={onNavigate}
              nested
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AdminSidebar({
  userEmail,
  role,
  onNavigate,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const items = navItemsForRole(role);

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="border-b border-border px-4 py-3">
        <Link
          href="/admin"
          onClick={onNavigate}
          className="text-sm font-semibold tracking-tight text-foreground"
        >
          Kavcom Expert
        </Link>
        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted">
          {role}
        </p>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto py-3">
        {items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="space-y-2 border-t border-border px-3 py-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
            Theme
          </span>
          <ThemeToggle />
        </div>
        <p className="truncate px-1 text-xs text-muted" title={userEmail}>
          {userEmail}
        </p>
        <SignOutButton className="h-8 w-full px-3 text-xs" />
      </div>
    </div>
  );
}
