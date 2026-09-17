export type NavChildItem = {
  label: string;
  href: string;
};

export type NavItem = {
  id?: string;
  label: string;
  href: string;
  children?: readonly NavChildItem[];
  viewAllLabel?: string;
};

/** Flat header nav fallback — no hardcoded dropdowns; menus table is source of truth. */
export const primaryNavItems: readonly NavItem[] = [
  { label: "Services", href: "/services" },
  { label: "Work", href: "/work" },
  { label: "Blog", href: "/blog" },
  { label: "About Us", href: "/about-us" },
  { label: "Contact", href: "/contact-us" },
];

export const companyNavItems = [
  { label: "About Us", href: "/about-us" },
  { label: "Work", href: "/work" },
  { label: "Blog", href: "/blog" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/contact-us" },
] as const;

export const siteTagline = "From Vision To Virtual - We Build It All";
