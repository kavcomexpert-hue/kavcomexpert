"use client";

import {
  deleteCategory,
  deleteTag,
  saveCategory,
  saveTag,
} from "@/actions/taxonomy";
import { useToast } from "@/components/ui/toast";
import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import slugify from "slugify";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  focusKeyword?: string | null;
  secondaryKeywords?: string | null;
  noIndex?: boolean | null;
  usageCount: number;
};

type TagRow = {
  id: string;
  name: string;
  slug: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  focusKeyword?: string | null;
  secondaryKeywords?: string | null;
  noIndex?: boolean | null;
  usageCount: number;
};

const UNCATEGORIZED_SLUG = "uncategorized";

const fieldClassName =
  "h-10 w-full rounded-default border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

type TabId = "categories" | "tags";

export function TaxonomyManager({
  categories: initialCategories,
  tags: initialTags,
}: {
  categories: CategoryRow[];
  tags: TagRow[];
}) {
  const [tab, setTab] = useState<TabId>("categories");

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: "categories", label: "Categories", count: initialCategories.length },
    { id: "tags", label: "Tags", count: initialTags.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-1 rounded-default border border-border bg-background p-1 sm:max-w-md">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`flex-1 rounded-[10px] px-3 py-2 text-sm font-medium transition-colors ${
              tab === item.id
                ? "bg-accent text-surface"
                : "text-muted hover:text-foreground"
            }`}
          >
            {item.label}
            <span className="ml-1.5 opacity-70">({item.count})</span>
          </button>
        ))}
      </div>

      {tab === "categories" ? (
        <CategoriesPanel items={initialCategories} />
      ) : (
        <TagsPanel items={initialTags} />
      )}
    </div>
  );
}

function CategoriesPanel({ items }: { items: CategoryRow[] }) {
  const { toast } = useToast();
  const router = useRouter();
  const [rows, setRows] = useState(items);
  const [prevItems, setPrevItems] = useState(items);
  const [draft, setDraft] = useState({ name: "", slug: "", description: "" });
  const [savingId, setSavingId] = useState<string | null>(null);

  if (items !== prevItems) {
    setPrevItems(items);
    setRows(items);
  }

  async function handleCreate() {
    setSavingId("new");
    const result = await saveCategory({
      name: draft.name,
      slug: draft.slug || undefined,
      description: draft.description || undefined,
    });
    setSavingId(null);

    if (!result.success) {
      toast(result.error, "error");
      return;
    }

    toast("Category created");
    setDraft({ name: "", slug: "", description: "" });
    router.refresh();
  }

  async function handleUpdate(row: CategoryRow) {
    setSavingId(row.id);
    const result = await saveCategory({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description ?? undefined,
      metaTitle: row.metaTitle ?? undefined,
      metaDescription: row.metaDescription ?? undefined,
      focusKeyword: row.focusKeyword ?? undefined,
      secondaryKeywords: row.secondaryKeywords ?? undefined,
      noIndex: row.noIndex ?? false,
    });
    setSavingId(null);

    if (!result.success) {
      toast(result.error, "error");
      return;
    }

    toast("Category updated");
    router.refresh();
  }

  async function handleDelete(row: CategoryRow) {
    if (row.slug === UNCATEGORIZED_SLUG) {
      toast("Cannot delete the Uncategorized category", "error");
      return;
    }

    const message =
      row.usageCount > 0
        ? `Delete "${row.name}"? ${row.usageCount} post(s) will move to Uncategorized.`
        : `Delete "${row.name}"?`;

    if (!window.confirm(message)) return;

    const result = await deleteCategory(row.id);
    if (!result.success) {
      toast(result.error, "error");
      return;
    }
    setRows((current) => current.filter((item) => item.id !== row.id));
    toast("Category deleted");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-default border border-border bg-surface p-5 shadow-soft dark:shadow-glow">
        <h2 className="text-sm font-medium text-foreground">Add category</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input
            value={draft.name}
            onChange={(event) => {
              const name = event.target.value;
              setDraft((current) => ({
                ...current,
                name,
                slug:
                  current.slug &&
                  current.slug !==
                    slugify(current.name, { lower: true, strict: true })
                    ? current.slug
                    : slugify(name, { lower: true, strict: true }),
              }));
            }}
            placeholder="Name"
            className={fieldClassName}
          />
          <input
            value={draft.slug}
            onChange={(event) =>
              setDraft((current) => ({ ...current, slug: event.target.value }))
            }
            placeholder="slug"
            className={fieldClassName}
          />
          <input
            value={draft.description}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            placeholder="Description (optional)"
            className={fieldClassName}
          />
        </div>
        <button
          type="button"
          onClick={() => void handleCreate()}
          disabled={savingId === "new" || !draft.name.trim()}
          className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-surface disabled:opacity-50"
        >
          {savingId === "new" ? "Saving…" : "Create category"}
        </button>
      </div>

      <div className="overflow-hidden rounded-default border border-border bg-surface shadow-soft dark:shadow-glow">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-background/60">
              <th className="px-4 py-3 font-medium text-muted">Name</th>
              <th className="px-4 py-3 font-medium text-muted">Slug</th>
              <th className="px-4 py-3 font-medium text-muted">Description</th>
              <th className="px-4 py-3 font-medium text-muted">Posts</th>
              <th className="px-4 py-3 font-medium text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isUncategorized = row.slug === UNCATEGORIZED_SLUG;
              return (
                <Fragment key={row.id}>
                <tr className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <input
                      value={row.name}
                      onChange={(event) =>
                        setRows((current) =>
                          current.map((item) =>
                            item.id === row.id
                              ? { ...item, name: event.target.value }
                              : item,
                          ),
                        )
                      }
                      className={fieldClassName}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      value={row.slug}
                      disabled={isUncategorized}
                      onChange={(event) =>
                        setRows((current) =>
                          current.map((item) =>
                            item.id === row.id
                              ? { ...item, slug: event.target.value }
                              : item,
                          ),
                        )
                      }
                      className={fieldClassName}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      value={row.description ?? ""}
                      onChange={(event) =>
                        setRows((current) =>
                          current.map((item) =>
                            item.id === row.id
                              ? { ...item, description: event.target.value }
                              : item,
                          ),
                        )
                      }
                      className={fieldClassName}
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">
                    {row.usageCount}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleUpdate(row)}
                        disabled={savingId === row.id}
                        className="h-9 rounded-full border border-border px-3 text-xs font-medium text-foreground hover:border-accent"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(row)}
                        disabled={isUncategorized}
                        className="h-9 rounded-full border border-border px-3 text-xs font-medium text-danger hover:border-danger disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
                <tr className="border-b border-border bg-background/40">
                  <td colSpan={5} className="px-4 py-3">
                    <div className="grid gap-2 md:grid-cols-4">
                      <input
                        value={row.metaTitle ?? ""}
                        onChange={(event) =>
                          setRows((current) =>
                            current.map((item) =>
                              item.id === row.id
                                ? { ...item, metaTitle: event.target.value }
                                : item,
                            ),
                          )
                        }
                        placeholder="SEO title"
                        className={fieldClassName}
                      />
                      <input
                        value={row.metaDescription ?? ""}
                        onChange={(event) =>
                          setRows((current) =>
                            current.map((item) =>
                              item.id === row.id
                                ? {
                                    ...item,
                                    metaDescription: event.target.value,
                                  }
                                : item,
                            ),
                          )
                        }
                        placeholder="Meta description"
                        className={fieldClassName}
                      />
                      <input
                        value={row.focusKeyword ?? ""}
                        onChange={(event) =>
                          setRows((current) =>
                            current.map((item) =>
                              item.id === row.id
                                ? { ...item, focusKeyword: event.target.value }
                                : item,
                            ),
                          )
                        }
                        placeholder="Focus keyword"
                        className={fieldClassName}
                      />
                      <input
                        value={row.secondaryKeywords ?? ""}
                        onChange={(event) =>
                          setRows((current) =>
                            current.map((item) =>
                              item.id === row.id
                                ? {
                                    ...item,
                                    secondaryKeywords: event.target.value,
                                  }
                                : item,
                            ),
                          )
                        }
                        placeholder="Secondary keywords"
                        className={fieldClassName}
                      />
                    </div>
                  </td>
                </tr>
                </Fragment>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  No categories yet. Create one above.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TagsPanel({ items }: { items: TagRow[] }) {
  const { toast } = useToast();
  const router = useRouter();
  const [rows, setRows] = useState(items);
  const [prevItems, setPrevItems] = useState(items);
  const [draft, setDraft] = useState({ name: "", slug: "" });
  const [savingId, setSavingId] = useState<string | null>(null);

  if (items !== prevItems) {
    setPrevItems(items);
    setRows(items);
  }

  async function handleCreate() {
    setSavingId("new");
    const result = await saveTag({
      name: draft.name,
      slug: draft.slug || undefined,
    });
    setSavingId(null);

    if (!result.success) {
      toast(result.error, "error");
      return;
    }

    toast("Tag created");
    setDraft({ name: "", slug: "" });
    router.refresh();
  }

  async function handleUpdate(row: TagRow) {
    setSavingId(row.id);
    const result = await saveTag({
      id: row.id,
      name: row.name,
      slug: row.slug,
      metaTitle: row.metaTitle ?? undefined,
      metaDescription: row.metaDescription ?? undefined,
      focusKeyword: row.focusKeyword ?? undefined,
      secondaryKeywords: row.secondaryKeywords ?? undefined,
      noIndex: row.noIndex ?? false,
    });
    setSavingId(null);

    if (!result.success) {
      toast(result.error, "error");
      return;
    }

    toast("Tag updated");
    router.refresh();
  }

  async function handleDelete(row: TagRow) {
    const message =
      row.usageCount > 0
        ? `Delete "${row.name}"? It is used on ${row.usageCount} post(s).`
        : `Delete "${row.name}"?`;

    if (!window.confirm(message)) return;

    const result = await deleteTag(row.id);
    if (!result.success) {
      toast(result.error, "error");
      return;
    }
    setRows((current) => current.filter((item) => item.id !== row.id));
    toast("Tag deleted");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-default border border-border bg-surface p-5 shadow-soft dark:shadow-glow">
        <h2 className="text-sm font-medium text-foreground">Add tag</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            value={draft.name}
            onChange={(event) => {
              const name = event.target.value;
              setDraft((current) => ({
                ...current,
                name,
                slug:
                  current.slug &&
                  current.slug !==
                    slugify(current.name, { lower: true, strict: true })
                    ? current.slug
                    : slugify(name, { lower: true, strict: true }),
              }));
            }}
            placeholder="Name"
            className={fieldClassName}
          />
          <input
            value={draft.slug}
            onChange={(event) =>
              setDraft((current) => ({ ...current, slug: event.target.value }))
            }
            placeholder="slug"
            className={fieldClassName}
          />
        </div>
        <button
          type="button"
          onClick={() => void handleCreate()}
          disabled={savingId === "new" || !draft.name.trim()}
          className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-surface disabled:opacity-50"
        >
          {savingId === "new" ? "Saving…" : "Create tag"}
        </button>
      </div>

      <div className="overflow-hidden rounded-default border border-border bg-surface shadow-soft dark:shadow-glow">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-background/60">
              <th className="px-4 py-3 font-medium text-muted">Name</th>
              <th className="px-4 py-3 font-medium text-muted">Slug</th>
              <th className="px-4 py-3 font-medium text-muted">Posts</th>
              <th className="px-4 py-3 font-medium text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Fragment key={row.id}>
              <tr className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <input
                    value={row.name}
                    onChange={(event) =>
                      setRows((current) =>
                        current.map((item) =>
                          item.id === row.id
                            ? { ...item, name: event.target.value }
                            : item,
                        ),
                      )
                    }
                    className={fieldClassName}
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    value={row.slug}
                    onChange={(event) =>
                      setRows((current) =>
                        current.map((item) =>
                          item.id === row.id
                            ? { ...item, slug: event.target.value }
                            : item,
                        ),
                      )
                    }
                    className={fieldClassName}
                  />
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted">
                  {row.usageCount}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleUpdate(row)}
                      disabled={savingId === row.id}
                      className="h-9 rounded-full border border-border px-3 text-xs font-medium text-foreground hover:border-accent"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(row)}
                      className="h-9 rounded-full border border-border px-3 text-xs font-medium text-danger hover:border-danger"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
              <tr className="border-b border-border bg-background/40">
                <td colSpan={4} className="px-4 py-3">
                  <div className="grid gap-2 md:grid-cols-4">
                    <input
                      value={row.metaTitle ?? ""}
                      onChange={(event) =>
                        setRows((current) =>
                          current.map((item) =>
                            item.id === row.id
                              ? { ...item, metaTitle: event.target.value }
                              : item,
                          ),
                        )
                      }
                      placeholder="SEO title"
                      className={fieldClassName}
                    />
                    <input
                      value={row.metaDescription ?? ""}
                      onChange={(event) =>
                        setRows((current) =>
                          current.map((item) =>
                            item.id === row.id
                              ? { ...item, metaDescription: event.target.value }
                              : item,
                          ),
                        )
                      }
                      placeholder="Meta description"
                      className={fieldClassName}
                    />
                    <input
                      value={row.focusKeyword ?? ""}
                      onChange={(event) =>
                        setRows((current) =>
                          current.map((item) =>
                            item.id === row.id
                              ? { ...item, focusKeyword: event.target.value }
                              : item,
                          ),
                        )
                      }
                      placeholder="Focus keyword"
                      className={fieldClassName}
                    />
                    <input
                      value={row.secondaryKeywords ?? ""}
                      onChange={(event) =>
                        setRows((current) =>
                          current.map((item) =>
                            item.id === row.id
                              ? {
                                  ...item,
                                  secondaryKeywords: event.target.value,
                                }
                              : item,
                          ),
                        )
                      }
                      placeholder="Secondary keywords"
                      className={fieldClassName}
                    />
                  </div>
                </td>
              </tr>
              </Fragment>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  No tags yet. Create one above.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
