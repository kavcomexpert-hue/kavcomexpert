"use client";

import { deleteRedirect, saveRedirect } from "@/actions/redirects";
import { ContentHrefField } from "@/components/admin/content-href-field";
import { useToast } from "@/components/ui/toast";
import type { MenuLinkOption } from "@/lib/queries/menus";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type RedirectRow = {
  id: string;
  fromPath: string;
  toPath: string;
  permanent: boolean | null;
  hits: number | null;
};

const fieldClassName =
  "h-10 w-full rounded-default border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

export function RedirectsManager({
  items,
  linkOptions,
}: {
  items: RedirectRow[];
  linkOptions: MenuLinkOption[];
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [rows, setRows] = useState(items);
  const [newRow, setNewRow] = useState({
    fromPath: "",
    toPath: "",
    permanent: true,
  });
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [prevItems, setPrevItems] = useState(items);

  if (items !== prevItems) {
    setPrevItems(items);
    setRows(items);
  }

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter(
      (row) =>
        row.fromPath.toLowerCase().includes(query) ||
        row.toPath.toLowerCase().includes(query),
    );
  }, [rows, search]);

  async function handleCreate() {
    if (!newRow.fromPath.startsWith("/")) {
      toast("From path must start with /", "error");
      return;
    }
    if (newRow.fromPath === newRow.toPath) {
      toast("From and to paths must be different", "error");
      return;
    }

    setSavingId("new");
    const result = await saveRedirect(newRow);
    setSavingId(null);

    if (!result.success) {
      toast(result.error, "error");
      return;
    }

    if (result.warning) {
      toast("Redirect added");
      toast(result.warning, "error");
    } else {
      toast("Redirect added");
    }
    setNewRow({ fromPath: "", toPath: "", permanent: true });
    router.refresh();
  }

  async function handleUpdate(row: RedirectRow) {
    if (!row.fromPath.startsWith("/")) {
      toast("From path must start with /", "error");
      return;
    }
    if (row.fromPath === row.toPath) {
      toast("From and to paths must be different", "error");
      return;
    }

    setSavingId(row.id);
    const result = await saveRedirect({
      id: row.id,
      fromPath: row.fromPath,
      toPath: row.toPath,
      permanent: Boolean(row.permanent),
    });
    setSavingId(null);

    if (!result.success) {
      toast(result.error, "error");
      return;
    }

    if (result.warning) {
      toast("Redirect updated");
      toast(result.warning, "error");
    } else {
      toast("Redirect updated");
    }
    router.refresh();
  }

  async function handleDelete(id: string) {
    const result = await deleteRedirect(id);
    if (!result.success) {
      toast(result.error, "error");
      return;
    }
    setRows((current) => current.filter((row) => row.id !== id));
    toast("Redirect deleted");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <label className="block max-w-md">
        <span className="sr-only">Search redirects</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by from or to path…"
          className={fieldClassName}
        />
      </label>
      <div className="overflow-hidden rounded-default border border-border bg-surface shadow-soft dark:shadow-glow">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-background">
              <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted">
                From
              </th>
              <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted">
                To
              </th>
              <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted">
                Permanent
              </th>
              <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted">
                Hits
              </th>
              <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border bg-background/50 align-top">
              <td className="px-4 py-3">
                <ContentHrefField
                  value={newRow.fromPath}
                  onChange={(fromPath) =>
                    setNewRow((r) => ({ ...r, fromPath }))
                  }
                  linkOptions={linkOptions}
                  placeholder="/old-path"
                  inputAriaLabel="From path"
                />
              </td>
              <td className="px-4 py-3">
                <ContentHrefField
                  value={newRow.toPath}
                  onChange={(toPath) => setNewRow((r) => ({ ...r, toPath }))}
                  linkOptions={linkOptions}
                  placeholder="/new-path"
                  inputAriaLabel="To path"
                />
              </td>
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={newRow.permanent}
                  onChange={(e) =>
                    setNewRow((r) => ({ ...r, permanent: e.target.checked }))
                  }
                  className="size-4 rounded border-border text-accent"
                />
              </td>
              <td className="px-4 py-3 font-mono text-xs text-muted">0</td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  disabled={savingId === "new"}
                  onClick={() => void handleCreate()}
                  className="inline-flex h-10 items-center justify-center rounded-default bg-accent px-4 text-sm font-medium text-surface"
                >
                  Add
                </button>
              </td>
            </tr>
            {filteredRows.length === 0 && rows.length > 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-sm text-muted"
                >
                  No redirects match your search.
                </td>
              </tr>
            ) : null}
            {filteredRows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border align-top last:border-b-0"
              >
                <td className="px-4 py-3">
                  <ContentHrefField
                    value={row.fromPath}
                    onChange={(fromPath) =>
                      setRows((current) =>
                        current.map((item) =>
                          item.id === row.id ? { ...item, fromPath } : item,
                        ),
                      )
                    }
                    linkOptions={linkOptions}
                    inputAriaLabel="From path"
                  />
                </td>
                <td className="px-4 py-3">
                  <ContentHrefField
                    value={row.toPath}
                    onChange={(toPath) =>
                      setRows((current) =>
                        current.map((item) =>
                          item.id === row.id ? { ...item, toPath } : item,
                        ),
                      )
                    }
                    linkOptions={linkOptions}
                    inputAriaLabel="To path"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={Boolean(row.permanent)}
                    onChange={(e) =>
                      setRows((current) =>
                        current.map((item) =>
                          item.id === row.id
                            ? { ...item, permanent: e.target.checked }
                            : item,
                        ),
                      )
                    }
                    className="size-4 rounded border-border text-accent"
                  />
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted">
                  {row.hits ?? 0}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={savingId === row.id}
                      onClick={() => void handleUpdate(row)}
                      className="inline-flex h-10 items-center justify-center rounded-default border border-border px-3 text-sm text-foreground"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(row.id)}
                      className="inline-flex h-10 items-center justify-center rounded-default border border-danger/30 px-3 text-sm text-danger"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
