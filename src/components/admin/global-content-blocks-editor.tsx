"use client";

import { saveContentBlock } from "@/actions/content-blocks";
import { LinkButtonField } from "@/components/admin/link-button-field";
import { MediaPicker } from "@/components/admin/media-picker";
import { useToast } from "@/components/ui/toast";
import {
  CONTENT_BLOCK_DEFS,
  isLinkButtonValue,
  textFromValue,
  type ContentBlockDef,
} from "@/lib/content/blocks";
import {
  normalizeLinkButton,
  type LinkButton,
} from "@/lib/content/link-button";
import type { ContentBlockValue } from "@/lib/db/schema";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const fieldClassName =
  "w-full rounded-default border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const GLOBAL_PREFIX = "global.";

type BlockRow = {
  key: string;
  label: string;
  type: string;
  value: ContentBlockValue;
};

function defaultLinkFromDef(def: ContentBlockDef): LinkButton {
  if (isLinkButtonValue(def.defaultValue)) return { ...def.defaultValue };
  return { label: textFromValue(def.defaultValue, ""), href: "/", enabled: true };
}

export function GlobalContentBlocksEditor({
  contentBlocks,
}: {
  contentBlocks: BlockRow[];
}) {
  const { toast } = useToast();
  const router = useRouter();

  const blockDefs = useMemo(
    () =>
      CONTENT_BLOCK_DEFS.filter(
        (def) =>
          def.key.startsWith(GLOBAL_PREFIX) &&
          def.key !== "global.chatbot.flow_json",
      ),
    [],
  );

  const blockRows = useMemo(() => {
    const byKey = new Map(contentBlocks.map((b) => [b.key, b]));
    return blockDefs.map((def) => ({
      def,
      value: byKey.get(def.key)?.value ?? def.defaultValue,
    }));
  }, [blockDefs, contentBlocks]);

  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      blockRows
        .filter(({ def }) => def.type !== "linkbutton")
        .map(({ def, value }) => [
          def.key,
          def.type === "image"
            ? "url" in value && typeof value.url === "string"
              ? value.url
              : ""
            : textFromValue(value, ""),
        ]),
    ),
  );
  const [linkDrafts, setLinkDrafts] = useState<Record<string, LinkButton>>(
    () =>
      Object.fromEntries(
        blockRows
          .filter(({ def }) => def.type === "linkbutton")
          .map(({ def, value }) => [
            def.key,
            normalizeLinkButton(value, defaultLinkFromDef(def)),
          ]),
      ),
  );
  const [alts, setAlts] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      blockRows
        .filter(({ def }) => def.type === "image")
        .map(({ def, value }) => [
          def.key,
          "alt" in value && typeof value.alt === "string" ? value.alt : "",
        ]),
    ),
  );
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [pickerKey, setPickerKey] = useState<string | null>(null);

  async function saveBlock(def: ContentBlockDef) {
    setSavingKey(def.key);
    const link = linkDrafts[def.key] ?? defaultLinkFromDef(def);
    const result = await saveContentBlock({
      key: def.key,
      type: def.type,
      text: drafts[def.key],
      url: drafts[def.key],
      alt: alts[def.key],
      label: link.label,
      href: link.href,
      enabled: link.enabled,
    });
    setSavingKey(null);
    if (!result.success) {
      toast(result.error, "error");
      return;
    }
    toast("Saved");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Header, footer, CTA band, 404, and other site-wide strings and buttons.
        Chatbot flow JSON is under Settings → Tools → Chatbot.
      </p>
      {blockRows.map(({ def }) => (
        <div
          key={def.key}
          className="space-y-2 rounded-default border border-border bg-surface p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">{def.label}</p>
              <p className="font-mono text-[10px] text-muted">{def.key}</p>
            </div>
            <button
              type="button"
              disabled={savingKey === def.key}
              onClick={() => void saveBlock(def)}
              className="inline-flex h-8 shrink-0 items-center justify-center rounded-default bg-accent px-3 text-xs font-medium text-surface disabled:opacity-60"
            >
              {savingKey === def.key ? "Saving…" : "Save"}
            </button>
          </div>
          {def.type === "linkbutton" ? (
            <LinkButtonField
              value={linkDrafts[def.key] ?? defaultLinkFromDef(def)}
              onChange={(v) =>
                setLinkDrafts((d) => ({ ...d, [def.key]: v }))
              }
            />
          ) : def.type === "richtext" ? (
            <textarea
              rows={3}
              value={drafts[def.key] ?? ""}
              onChange={(e) =>
                setDrafts((d) => ({ ...d, [def.key]: e.target.value }))
              }
              className={fieldClassName}
            />
          ) : def.type === "image" ? (
            <div className="space-y-2">
              {drafts[def.key] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={drafts[def.key]}
                  alt={alts[def.key] || def.label}
                  className="max-h-32 rounded-default border border-border object-contain"
                />
              ) : null}
              <input
                value={alts[def.key] ?? ""}
                onChange={(e) =>
                  setAlts((a) => ({ ...a, [def.key]: e.target.value }))
                }
                placeholder="Alt text (required)"
                className={fieldClassName}
              />
              <button
                type="button"
                onClick={() => setPickerKey(def.key)}
                className="text-sm font-medium text-accent"
              >
                Choose image
              </button>
            </div>
          ) : (
            <input
              value={drafts[def.key] ?? ""}
              onChange={(e) =>
                setDrafts((d) => ({ ...d, [def.key]: e.target.value }))
              }
              className={fieldClassName}
            />
          )}
        </div>
      ))}

      <MediaPicker
        open={pickerKey !== null}
        onClose={() => setPickerKey(null)}
        onSelect={(url) => {
          if (pickerKey) {
            setDrafts((d) => ({ ...d, [pickerKey]: url }));
          }
          setPickerKey(null);
        }}
      />
    </div>
  );
}
