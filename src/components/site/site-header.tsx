"use client";

import {
  lockPageScroll,
  unlockPageScroll,
} from "@/components/site/lenis-provider";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { NavItem } from "@/lib/site/nav";
import { SiteLinkButton } from "@/components/site/site-link-button";
import { linkButton, type LinkButton } from "@/lib/content/link-button";
import { ChevronDown, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";

type SiteHeaderProps = {
  organizationName: string;
  navItems: readonly NavItem[];
  cta?: LinkButton;
  logoSrc?: string;
};

const navLinkClass =
  "font-display text-sm font-medium tracking-[-0.01em] transition-colors duration-300";

function isNavActive(pathname: string, item: NavItem) {
  if (pathname === item.href) {
    return true;
  }

  if (item.href !== "/" && pathname.startsWith(`${item.href}/`)) {
    return true;
  }

  return item.children?.some(
    (child) =>
      pathname === child.href || pathname.startsWith(`${child.href}/`),
  );
}

function DesktopNavItem({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const menuId = useId();
  const active = isNavActive(pathname, item);

  if (!item.children?.length) {
    return (
      <Link
        href={item.href}
        className={`${navLinkClass} ${
          active
            ? "text-foreground"
            : "text-muted hover:text-accent"
        }`}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div className="group relative">
      <Link
        href={item.href}
        aria-haspopup="menu"
        aria-expanded="false"
        aria-controls={menuId}
        className={`inline-flex items-center gap-1 ${navLinkClass} ${
          active
            ? "text-foreground"
            : "text-muted hover:text-accent"
        }`}
      >
        {item.label}
        <ChevronDown
          className="size-4 transition-transform duration-300 group-hover:rotate-180 group-focus-within:rotate-180"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </Link>
      <div
        id={menuId}
        role="menu"
        className="pointer-events-none invisible absolute left-1/2 top-full z-50 w-72 -translate-x-1/2 pt-3 opacity-0 transition-[opacity,visibility] duration-200 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100"
      >
        <div
          data-lenis-prevent
          className="max-h-[min(70vh,28rem)] overflow-y-auto overscroll-contain rounded-default border border-border bg-surface py-2 shadow-soft dark:border-border dark:bg-surface dark:shadow-glow"
        >
          {item.children.map((child) => {
            const childActive =
              pathname === child.href ||
              pathname.startsWith(`${child.href}/`);

            return (
              <Link
                key={child.href}
                href={child.href}
                role="menuitem"
                className={`block px-4 py-2.5 font-display text-sm font-medium tracking-[-0.01em] transition-colors duration-300 ${
                  childActive
                    ? "bg-accent/10 text-accent"
                    : "text-muted hover:bg-accent/10 hover:text-accent"
                }`}
              >
                {child.label}
              </Link>
            );
          })}
          <div className="mx-4 my-2 border-t border-border" />
          <Link
            href={item.href}
            role="menuitem"
            className="block px-4 py-2.5 font-display text-sm font-medium tracking-[-0.01em] text-muted transition-colors duration-300 hover:bg-accent/10 hover:text-accent"
          >
            {item.viewAllLabel ?? "View all"}
          </Link>
        </div>
      </div>
    </div>
  );
}

export function SiteHeader({
  organizationName,
  navItems,
  cta = linkButton("Book a call", "/contact-us"),
  logoSrc = "/logo.png",
}: SiteHeaderProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpenHref, setMobileOpenHref] = useState<string | null>(null);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    lockPageScroll();
    return () => {
      unlockPageScroll();
    };
  }, [menuOpen]);

  const [navPath, setNavPath] = useState(pathname);
  if (pathname !== navPath) {
    setNavPath(pathname);
    setMenuOpen(false);
    setMobileOpenHref(null);
  }

  return (
    <>
      <header
        className={`sticky top-[var(--admin-bar-offset,0px)] z-50 transition-[background-color,backdrop-filter,border-color,box-shadow] duration-300 ${
          scrolled
            ? "border-b border-border bg-background/95 shadow-soft backdrop-blur-md dark:bg-background/90 dark:shadow-none"
            : "border-b border-border/60 bg-background/80 backdrop-blur-md"
        }`}
      >
        <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-4 px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight text-foreground transition-colors duration-300 hover:text-accent"
          >
            <Image
              src={logoSrc}
              alt=""
              width={34}
              height={34}
              priority
              sizes="34px"
              quality={80}
              className="size-8.5 object-contain"
            />
            {organizationName}
          </Link>

          <nav
            aria-label="Primary"
            className="hidden items-center gap-8 lg:flex"
          >
            {navItems.map((item) => (
              <DesktopNavItem
                key={item.id ?? item.href}
                item={item}
                pathname={pathname}
              />
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <SiteLinkButton
              button={cta}
              className="hidden h-10 items-center justify-center rounded-full bg-accent px-5 font-display text-sm font-medium tracking-[-0.01em] text-surface transition-[opacity,transform] duration-300 hover:opacity-90 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:inline-flex"
            />
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex size-10 items-center justify-center rounded-default border border-border bg-surface text-foreground transition-colors duration-300 hover:border-accent/40 hover:bg-accent/10 hover:text-accent lg:hidden"
            >
              {menuOpen ? (
                <X className="size-5" strokeWidth={1.5} aria-hidden="true" />
              ) : (
                <Menu className="size-5" strokeWidth={1.5} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>

      <div
        id="mobile-nav"
        aria-hidden={!menuOpen}
        data-lenis-prevent
        className={`fixed inset-0 z-40 overflow-y-auto bg-background transition-opacity duration-300 lg:hidden ${
          menuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        <nav
          aria-label="Mobile primary"
          className="flex min-h-full flex-col px-8 pb-10 pt-24"
        >
          <ul className="space-y-2">
            {navItems.map((item, index) => (
              <li
                key={item.id ?? `${item.href}-${index}`}
                className="motion-safe:transition motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                style={{
                  transitionDelay: menuOpen ? `${index * 60}ms` : "0ms",
                  opacity: menuOpen ? 1 : 0,
                  transform: menuOpen ? "translateY(0)" : "translateY(16px)",
                }}
              >
                {item.children?.length ? (
                  <div>
                    <button
                      type="button"
                      aria-expanded={mobileOpenHref === item.href}
                      onClick={() =>
                        setMobileOpenHref((current) =>
                          current === item.href ? null : item.href,
                        )
                      }
                      className="flex w-full items-center justify-between py-3 font-display text-3xl font-semibold tracking-tight text-foreground transition-colors duration-300 hover:text-accent"
                    >
                      {item.label}
                      <ChevronDown
                        className={`size-5 transition-transform duration-300 ${
                          mobileOpenHref === item.href ? "rotate-180" : ""
                        }`}
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                    </button>
                    {mobileOpenHref === item.href ? (
                      <ul className="mb-2 space-y-1 border-l border-border pl-4">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className="block py-2 font-display text-lg font-medium tracking-[-0.01em] text-muted transition-colors duration-300 hover:text-accent"
                              onClick={() => setMenuOpen(false)}
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                        <li>
                          <Link
                            href={item.href}
                            className="block py-2 font-display text-lg font-medium tracking-[-0.01em] text-muted transition-colors duration-300 hover:text-accent"
                            onClick={() => setMenuOpen(false)}
                          >
                            {item.viewAllLabel ?? "View all"}
                          </Link>
                        </li>
                      </ul>
                    ) : null}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className="block py-3 font-display text-3xl font-semibold tracking-tight text-foreground transition-colors duration-300 hover:text-accent"
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>

          <div
            className="motion-safe:transition motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none mt-10"
            style={{
              transitionDelay: menuOpen
                ? `${navItems.length * 60}ms`
                : "0ms",
              opacity: menuOpen ? 1 : 0,
              transform: menuOpen ? "translateY(0)" : "translateY(16px)",
            }}
          >
            <SiteLinkButton
              button={cta}
              className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-6 font-display text-sm font-medium tracking-[-0.01em] text-surface transition-[opacity,filter] duration-300 hover:opacity-90 hover:brightness-110"
              anchorProps={{ onClick: () => setMenuOpen(false) }}
            />
          </div>
        </nav>
      </div>
    </>
  );
}
