import type { LucideIcon } from "lucide-react";
import {
  ArrowRightLeft,
  Briefcase,
  ClipboardList,
  FileText,
  FolderTree,
  Image,
  Inbox,
  Layers,
  LayoutDashboard,
  LayoutTemplate,
  Megaphone,
  Menu,
  MessageSquareQuote,
  Rocket,
  ScrollText,
  SearchCheck,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import type { AppRole } from "@/lib/authz";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** If set, only these roles see the item. Omit = all authenticated roles. */
  roles?: AppRole[];
  children?: AdminNavItem[];
};

export const adminNavItems: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  {
    label: "Posts",
    href: "/admin/posts",
    icon: FileText,
    children: [
      {
        label: "Categories & Tags",
        href: "/admin/taxonomy",
        icon: FolderTree,
        roles: ["admin", "editor"],
      },
    ],
  },
  {
    label: "Pages",
    href: "/admin/pages",
    icon: LayoutTemplate,
    roles: ["admin", "editor"],
  },
  {
    label: "Landing pages",
    href: "/admin/landing-pages",
    icon: Rocket,
    roles: ["admin", "editor"],
  },
  { label: "Case Studies", href: "/admin/case-studies", icon: Briefcase },
  {
    label: "Work Gallery",
    href: "/admin/work-gallery",
    icon: Image,
  },
  {
    label: "Services",
    href: "/admin/services",
    icon: Layers,
    roles: ["admin", "editor"],
  },
  {
    label: "Testimonials",
    href: "/admin/testimonials",
    icon: MessageSquareQuote,
    roles: ["admin", "editor"],
  },
  {
    label: "Popups",
    href: "/admin/popups",
    icon: Megaphone,
    roles: ["admin", "editor"],
  },
  { label: "Media", href: "/admin/media", icon: Image },
  {
    label: "Menus",
    href: "/admin/menus",
    icon: Menu,
    roles: ["admin", "editor"],
  },
  {
    label: "Careers",
    href: "/admin/jobs",
    icon: Briefcase,
    roles: ["admin", "editor"],
  },
  {
    label: "Applications",
    href: "/admin/applications",
    icon: ClipboardList,
    roles: ["admin", "editor"],
  },
  {
    label: "Leads",
    href: "/admin/leads",
    icon: Inbox,
    roles: ["admin", "editor"],
  },
  {
    label: "Redirects",
    href: "/admin/redirects",
    icon: ArrowRightLeft,
    roles: ["admin"],
  },
  {
    label: "SEO",
    href: "/admin/seo",
    icon: SearchCheck,
    roles: ["admin", "editor"],
  },
  { label: "Users", href: "/admin/users", icon: Users, roles: ["admin"] },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
    roles: ["admin"],
  },
  {
    label: "Audit Log",
    href: "/admin/audit-log",
    icon: ScrollText,
    roles: ["admin"],
  },
  { label: "Security", href: "/admin/security", icon: Shield },
];

function filterItem(item: AdminNavItem, role: AppRole): AdminNavItem | null {
  if (item.roles && !item.roles.includes(role)) {
    return null;
  }

  const children = item.children
    ?.map((child) => filterItem(child, role))
    .filter((child): child is AdminNavItem => child !== null);

  return {
    ...item,
    children: children && children.length > 0 ? children : undefined,
  };
}

export function navItemsForRole(role: AppRole): AdminNavItem[] {
  return adminNavItems
    .map((item) => filterItem(item, role))
    .filter((item): item is AdminNavItem => item !== null);
}
