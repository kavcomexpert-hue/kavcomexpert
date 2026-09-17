import Link from "next/link";
import {
  isExternalHref,
  linkButtonAnchorProps,
  type LinkButton,
} from "@/lib/content/link-button";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type SiteLinkButtonProps = {
  button: LinkButton | null | undefined;
  className?: string;
  children?: ReactNode;
  /** Extra props forwarded to the anchor (aria-*, etc.). */
  anchorProps?: Omit<
    ComponentPropsWithoutRef<"a">,
    "href" | "className" | "children" | "target" | "rel"
  >;
};

/**
 * Renders an admin-controlled link button.
 * When `enabled` is false, returns null (removed from DOM).
 */
export function SiteLinkButton({
  button,
  className,
  children,
  anchorProps,
}: SiteLinkButtonProps) {
  if (!button?.enabled) return null;

  const href = button.href.trim() || "#";
  const label = children ?? button.label;
  const external = isExternalHref(href);
  const blankProps = linkButtonAnchorProps(href);

  if (external || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return (
      <a href={href} className={className} {...blankProps} {...anchorProps}>
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={className} {...anchorProps}>
      {label}
    </Link>
  );
}
