"use client";

import { BOOKING_URL } from "@/components/houston-cpa/constants";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import Image from "next/image";
import Link from "next/link";

type LandingChromeProps = {
  organizationName: string;
  logoSrc?: string | null;
};

export function LandingTopBar({
  organizationName,
  logoSrc,
}: LandingChromeProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between gap-4 px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 text-foreground transition-opacity hover:opacity-80"
        >
          <Image
            src={logoSrc || "/logo.png"}
            alt=""
            width={36}
            height={36}
            className="size-9 object-contain"
            priority
          />
          <span className="font-display text-sm font-semibold tracking-tight sm:text-base">
            {organizationName}
          </span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="#pricing"
            className="hidden text-sm text-muted transition-colors hover:text-foreground sm:inline"
          >
            Pricing
          </a>
          <ThemeToggle />
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center justify-center rounded-full bg-accent px-4 text-sm font-medium text-surface transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            data-track="book_fit_call_header"
          >
            Book a Fit Call
          </a>
        </div>
      </div>
    </header>
  );
}

export function LandingMiniFooter({
  organizationName,
}: {
  organizationName: string;
}) {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-3 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-xs text-muted">
          © {new Date().getFullYear()} {organizationName}
        </p>
        <nav aria-label="Legal" className="flex flex-wrap gap-4">
          <Link
            href="/privacy-policy"
            className="text-xs text-muted transition-colors hover:text-foreground"
          >
            Privacy
          </Link>
          <Link
            href="/terms-of-service"
            className="text-xs text-muted transition-colors hover:text-foreground"
          >
            Terms
          </Link>
          <Link
            href="/services"
            className="text-xs text-muted transition-colors hover:text-foreground"
          >
            Services
          </Link>
        </nav>
      </div>
    </footer>
  );
}
