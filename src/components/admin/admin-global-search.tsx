"use client";

import { adminGlobalSearch, type AdminSearchGroup } from "@/actions/admin-search";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

const DEBOUNCE_MS = 280;

export function AdminGlobalSearch() {
  const router = useRouter();
  const inputId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<AdminSearchGroup[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const flatItems = groups.flatMap((group) =>
    group.items.map((item) => ({ ...item, groupLabel: group.label })),
  );

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setGroups([]);
    setError(null);
    setActiveIndex(0);
  }, []);

  const openSearch = useCallback(() => {
    setOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    function onKey(event: globalThis.KeyboardEvent) {
      const isCmdK =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (isCmdK) {
        event.preventDefault();
        if (open) close();
        else openSearch();
        return;
      }
      if (event.key === "Escape" && open) {
        event.preventDefault();
        close();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, openSearch]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();

    // All state updates happen inside the timeout callback (async), never
    // synchronously in the effect body.
    const handle = window.setTimeout(
      () => {
        if (q.length < 1) {
          setGroups([]);
          setLoading(false);
          setError(null);
          return;
        }

        setLoading(true);
        void (async () => {
          const result = await adminGlobalSearch(q);
          if (!result.success) {
            setError(result.error);
            setGroups([]);
            setLoading(false);
            return;
          }
          setError(null);
          setGroups(result.groups);
          setActiveIndex(0);
          setLoading(false);
        })();
      },
      q.length < 1 ? 0 : DEBOUNCE_MS,
    );

    return () => window.clearTimeout(handle);
  }, [query, open]);

  function navigateTo(href: string) {
    close();
    router.push(href);
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) =>
        flatItems.length === 0 ? 0 : Math.min(i + 1, flatItems.length - 1),
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = flatItems[activeIndex];
      if (item) navigateTo(item.href);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openSearch}
        className="inline-flex h-9 items-center gap-2 rounded-default border border-border bg-background px-3 text-sm text-muted transition-colors hover:border-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label="Open admin search"
      >
        <Search className="size-3.5 shrink-0" aria-hidden="true" />
        <span className="hidden sm:inline">Search</span>
        <kbd className="ml-1 hidden rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted md:inline">
          ⌘K
        </kbd>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70] flex items-start justify-center bg-foreground/40 px-4 pt-[12vh] backdrop-blur-sm">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close search"
            onClick={close}
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={inputId}
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-default border border-border bg-surface shadow-soft"
          >
            <div className="flex items-center gap-2 border-b border-border px-3">
              <Search className="size-4 shrink-0 text-muted" aria-hidden="true" />
              <input
                ref={inputRef}
                id={inputId}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Search posts, pages, services…"
                className="h-12 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="inline-flex size-8 items-center justify-center rounded-default text-muted hover:text-foreground"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
              {loading ? (
                <p className="px-3 py-4 text-sm text-muted">Searching…</p>
              ) : error ? (
                <p className="px-3 py-4 text-sm text-danger">{error}</p>
              ) : query.trim().length === 0 ? (
                <p className="px-3 py-4 text-sm text-muted">
                  Type to search across content. Press Esc to close.
                </p>
              ) : flatItems.length === 0 ? (
                <p className="px-3 py-4 text-sm text-muted">No results.</p>
              ) : (
                <div className="space-y-3">
                  {groups.map((group) => (
                    <div key={group.type}>
                      <p className="px-2 pb-1 font-mono text-[10px] uppercase tracking-wider text-muted">
                        {group.label}
                      </p>
                      <ul className="space-y-0.5">
                        {group.items.map((item) => {
                          const flatIdx = flatItems.findIndex(
                            (row) => row.id === item.id && row.href === item.href,
                          );
                          const active = flatIdx === activeIndex;
                          return (
                            <li key={`${group.type}-${item.id}`}>
                              <button
                                type="button"
                                onClick={() => navigateTo(item.href)}
                                onMouseEnter={() => setActiveIndex(flatIdx)}
                                className={`flex w-full flex-col rounded-[10px] px-3 py-2 text-left transition-colors ${
                                  active
                                    ? "bg-accent text-surface"
                                    : "text-foreground hover:bg-background"
                                }`}
                              >
                                <span className="text-sm font-medium">
                                  {item.title}
                                </span>
                                {item.meta ? (
                                  <span
                                    className={`font-mono text-[11px] ${
                                      active ? "text-surface/80" : "text-muted"
                                    }`}
                                  >
                                    {item.meta}
                                  </span>
                                ) : null}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
