"use client";

import type { MenuLinkOption } from "@/lib/queries/menus";
import { absoluteUrl } from "@/lib/seo/constants";
import { useId } from "react";

const fieldClassName =
  "h-10 w-full rounded-default border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

const GROUPS = [
  "Site",
  "Pages",
  "Services",
  "Posts",
  "Careers",
] as const;

export function ContentHrefField({
  value,
  onChange,
  linkOptions,
  disabled,
  placeholder = "/path or custom URL",
  inputAriaLabel = "Href",
}: {
  value: string;
  onChange: (href: string) => void;
  linkOptions: MenuLinkOption[];
  disabled?: boolean;
  placeholder?: string;
  inputAriaLabel?: string;
}) {
  const listId = useId();
  const pickerId = useId();

  return (
    <div className="space-y-1.5">
      <label className="block">
        <span className="sr-only">Pick published content</span>
        <select
          id={pickerId}
          value=""
          disabled={disabled}
          onChange={(e) => {
            const href = e.target.value;
            if (href) onChange(href);
          }}
          className={fieldClassName}
          aria-label="Pick published content"
        >
          <option value="">Pick content…</option>
          {GROUPS.map((group) => {
            const options = linkOptions.filter((o) => o.group === group);
            if (options.length === 0) return null;
            return (
              <optgroup key={group} label={group}>
                {options.map((option) => (
                  <option
                    key={`${option.group}-${option.href}`}
                    value={option.href}
                  >
                    {option.label}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
      </label>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          list={listId}
          placeholder={placeholder}
          className={fieldClassName}
          disabled={disabled}
          aria-label={inputAriaLabel}
        />
        <button
          type="button"
          disabled={disabled || !value.trim()}
          onClick={() => {
            const raw = value.trim();
            if (!raw) return;
            try {
              window.open(absoluteUrl(raw), "_blank", "noopener,noreferrer");
            } catch {
              // ignore invalid URL
            }
          }}
          className="inline-flex h-10 shrink-0 items-center rounded-default border border-border px-3 text-xs font-medium text-foreground disabled:opacity-50"
        >
          Open
        </button>
      </div>
      <datalist id={listId}>
        {linkOptions.map((option) => (
          <option
            key={`${option.group}-${option.href}`}
            value={option.href}
            label={`${option.group}: ${option.label}`}
          />
        ))}
      </datalist>
    </div>
  );
}
