"use client";

import { saveMenu } from "@/actions/menus";
import { ContentHrefField } from "@/components/admin/content-href-field";
import type { MenuLinkOption, MenuLocation } from "@/lib/queries/menus";
import { useToast } from "@/components/ui/toast";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type MenuChild = { label: string; href: string; order: number };

type EditableItem = {
  clientId: string;
  label: string;
  href: string;
  order: number;
  children: MenuChild[];
};

const fieldClassName =
  "w-full rounded-default border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const LOCATIONS: { id: MenuLocation; label: string }[] = [
  { id: "header", label: "Header" },
  { id: "footer-services", label: "Footer services" },
  { id: "footer-growth", label: "Footer growth & support" },
  { id: "footer-company", label: "Footer company" },
];

function newClientId() {
  return `tmp-${Math.random().toString(36).slice(2, 10)}`;
}

function toEditable(
  items: {
    clientId: string;
    label: string;
    href: string;
    order: number;
    children?: MenuChild[];
  }[],
): EditableItem[] {
  return items.map((item, index) => ({
    clientId: item.clientId || newClientId(),
    label: item.label,
    href: item.href,
    order: index,
    children: (item.children ?? []).map((child, childIndex) => ({
      ...child,
      order: childIndex,
    })),
  }));
}

export function MenusManager({
  menusByLocation,
  linkOptions,
}: {
  menusByLocation: Record<
    MenuLocation,
    {
      clientId: string;
      label: string;
      href: string;
      order: number;
      children?: MenuChild[];
    }[]
  >;
  linkOptions: MenuLinkOption[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState<MenuLocation>("header");
  const [drafts, setDrafts] = useState<Record<MenuLocation, EditableItem[]>>({
    header: toEditable(menusByLocation.header),
    "footer-services": toEditable(menusByLocation["footer-services"]),
    "footer-growth": toEditable(menusByLocation["footer-growth"]),
    "footer-company": toEditable(menusByLocation["footer-company"]),
  });
  const [prevMenus, setPrevMenus] = useState(menusByLocation);
  const [saving, setSaving] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  if (menusByLocation !== prevMenus) {
    setPrevMenus(menusByLocation);
    setDrafts({
      header: toEditable(menusByLocation.header),
      "footer-services": toEditable(menusByLocation["footer-services"]),
      "footer-growth": toEditable(menusByLocation["footer-growth"]),
      "footer-company": toEditable(menusByLocation["footer-company"]),
    });
  }

  const items = drafts[tab];

  function updateItems(next: EditableItem[]) {
    setDrafts((current) => ({
      ...current,
      [tab]: next.map((item, index) => ({ ...item, order: index })),
    }));
  }

  function handleDragOver(targetId: string) {
    if (!draggingId || draggingId === targetId) return;
    const fromIndex = items.findIndex((item) => item.clientId === draggingId);
    const toIndex = items.findIndex((item) => item.clientId === targetId);
    if (fromIndex === -1 || toIndex === -1) return;
    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    updateItems(next);
  }

  async function handleSave() {
    setSaving(true);
    const result = await saveMenu({
      location: tab,
      items: items.map((item, index) => ({
        label: item.label,
        href: item.href,
        order: index,
        children: item.children.map((child, childIndex) => ({
          label: child.label,
          href: child.href,
          order: childIndex,
        })),
      })),
    });
    setSaving(false);

    if (!result.success) {
      toast(result.error, "error");
      return;
    }

    toast("Menu saved");
    router.refresh();
  }

  function addItem() {
    updateItems([
      ...items,
      {
        clientId: newClientId(),
        label: "",
        href: "",
        order: items.length,
        children: [],
      },
    ]);
  }

  function addChild(parentId: string) {
    updateItems(
      items.map((item) =>
        item.clientId === parentId
          ? {
              ...item,
              children: [
                ...item.children,
                { label: "", href: "", order: item.children.length },
              ],
            }
          : item,
      ),
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-default border border-border bg-background p-1">
          {LOCATIONS.map((location) => (
            <button
              key={location.id}
              type="button"
              onClick={() => setTab(location.id)}
              className={`rounded-[10px] px-3 py-2 text-sm font-medium transition-colors ${
                tab === location.id
                  ? "bg-accent text-surface"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {location.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="inline-flex h-10 items-center justify-center rounded-default bg-accent px-5 text-sm font-medium text-surface disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save menu"}
        </button>
      </div>

      <p className="text-sm text-muted">
        Drag to reorder. Add one level of nested children for dropdowns. Pick a
        published page, service, or post, or type a custom path.
      </p>

      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.clientId}
            draggable
            onDragStart={() => setDraggingId(item.clientId)}
            onDragOver={(event) => {
              event.preventDefault();
              handleDragOver(item.clientId);
            }}
            onDragEnd={() => setDraggingId(null)}
            className={`rounded-default border border-border bg-surface p-4 ${
              draggingId === item.clientId ? "opacity-60" : ""
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <button
                type="button"
                aria-label="Drag to reorder"
                className="inline-flex size-9 shrink-0 cursor-grab items-center justify-center rounded-default text-muted active:cursor-grabbing"
              >
                <GripVertical className="size-4" aria-hidden="true" />
              </button>
              <div className="grid flex-1 gap-2 sm:grid-cols-2">
                <input
                  value={item.label}
                  onChange={(e) =>
                    updateItems(
                      items.map((row) =>
                        row.clientId === item.clientId
                          ? { ...row, label: e.target.value }
                          : row,
                      ),
                    )
                  }
                  placeholder="Label"
                  className={fieldClassName}
                  aria-label="Label"
                />
                <ContentHrefField
                  value={item.href}
                  linkOptions={linkOptions}
                  onChange={(href) =>
                    updateItems(
                      items.map((row) =>
                        row.clientId === item.clientId ? { ...row, href } : row,
                      ),
                    )
                  }
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  updateItems(items.filter((row) => row.clientId !== item.clientId))
                }
                className="inline-flex size-9 items-center justify-center rounded-default border border-danger/30 text-danger"
                aria-label="Delete item"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-3 space-y-2 border-l border-border pl-4 sm:ml-12">
              {item.children.map((child, childIndex) => (
                <div
                  key={`${item.clientId}-child-${childIndex}`}
                  className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
                >
                  <input
                    value={child.label}
                    onChange={(e) =>
                      updateItems(
                        items.map((row) =>
                          row.clientId === item.clientId
                            ? {
                                ...row,
                                children: row.children.map((c, i) =>
                                  i === childIndex
                                    ? { ...c, label: e.target.value }
                                    : c,
                                ),
                              }
                            : row,
                        ),
                      )
                    }
                    placeholder="Child label"
                    className={fieldClassName}
                  />
                  <ContentHrefField
                    value={child.href}
                    linkOptions={linkOptions}
                    onChange={(href) =>
                      updateItems(
                        items.map((row) =>
                          row.clientId === item.clientId
                            ? {
                                ...row,
                                children: row.children.map((c, i) =>
                                  i === childIndex ? { ...c, href } : c,
                                ),
                              }
                            : row,
                        ),
                      )
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateItems(
                        items.map((row) =>
                          row.clientId === item.clientId
                            ? {
                                ...row,
                                children: row.children.filter(
                                  (_, i) => i !== childIndex,
                                ),
                              }
                            : row,
                        ),
                      )
                    }
                    className="inline-flex h-10 items-center justify-center rounded-default border border-border px-3 text-sm text-danger"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addChild(item.clientId)}
                className="inline-flex h-9 items-center gap-1.5 text-sm font-medium text-accent"
              >
                <Plus className="size-3.5" aria-hidden="true" />
                Add child link
              </button>
            </div>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={addItem}
        className="inline-flex h-10 items-center gap-1.5 rounded-default border border-dashed border-border px-4 text-sm font-medium text-foreground"
      >
        <Plus className="size-4" aria-hidden="true" />
        Add menu item
      </button>
    </div>
  );
}
