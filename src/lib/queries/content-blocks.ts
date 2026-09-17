import { getDb } from "@/lib/db";
import { contentBlocks, type ContentBlockValue } from "@/lib/db/schema";
import {
  CONTENT_BLOCK_DEFS,
  getContentBlockDef,
  isLinkButtonValue,
  textFromValue,
  type ContentBlockKey,
} from "@/lib/content/blocks";
import {
  normalizeLinkButton,
  type LinkButton,
} from "@/lib/content/link-button";
import { eq, asc, inArray } from "drizzle-orm";
import { unstable_cache } from "next/cache";

async function fetchAllContentBlocks(): Promise<Record<string, ContentBlockValue>> {
  const rows = await getDb().select().from(contentBlocks);
  const map: Record<string, ContentBlockValue> = {};
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return map;
}

export function getAllContentBlocks() {
  return unstable_cache(fetchAllContentBlocks, ["content-blocks-v1"], {
    tags: ["content-blocks"],
  })();
}

async function fetchContentBlockValue(
  key: string,
): Promise<ContentBlockValue | null> {
  const [row] = await getDb()
    .select({ value: contentBlocks.value })
    .from(contentBlocks)
    .where(eq(contentBlocks.key, key))
    .limit(1);
  return row?.value ?? null;
}

function getCachedContentBlockValue(key: string) {
  return unstable_cache(
    () => fetchContentBlockValue(key),
    ["content-block-v1", key],
    { tags: ["content-blocks", `content-block-${key}`] },
  )();
}

async function fetchContentBlockValues(
  keys: readonly string[],
): Promise<Record<string, ContentBlockValue>> {
  if (keys.length === 0) return {};
  const rows = await getDb()
    .select({ key: contentBlocks.key, value: contentBlocks.value })
    .from(contentBlocks)
    .where(inArray(contentBlocks.key, [...keys]));
  const map: Record<string, ContentBlockValue> = {};
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return map;
}

export async function getContent(key: ContentBlockKey | string): Promise<string> {
  const def = getContentBlockDef(key);
  const fallback = def
    ? textFromValue(def.defaultValue, "")
    : "";
  try {
    const value = await getCachedContentBlockValue(key);
    return textFromValue(value ?? undefined, fallback);
  } catch {
    return fallback;
  }
}

export async function getContentMap(
  keys: readonly string[],
): Promise<Record<string, string>> {
  const unique = [...new Set(keys)];
  const values = await fetchContentBlockValues(unique).catch(
    () => ({} as Record<string, ContentBlockValue>),
  );
  const result: Record<string, string> = {};
  for (const key of keys) {
    const def = getContentBlockDef(key);
    const fallback = def ? textFromValue(def.defaultValue, "") : "";
    result[key] = textFromValue(values[key], fallback);
  }
  return result;
}

function defaultLinkButtonForKey(key: string): LinkButton {
  const def = getContentBlockDef(key);
  if (def && isLinkButtonValue(def.defaultValue)) {
    return { ...def.defaultValue };
  }
  return { label: "", href: "/", enabled: true };
}

export async function getLinkButton(
  key: ContentBlockKey | string,
  defaults?: LinkButton,
): Promise<LinkButton> {
  const fallback = defaults ?? defaultLinkButtonForKey(key);
  try {
    const value = await getCachedContentBlockValue(key);
    return normalizeLinkButton(value, fallback);
  } catch {
    return { ...fallback };
  }
}

export async function getLinkButtonMap(
  keys: readonly string[],
): Promise<Record<string, LinkButton>> {
  const unique = [...new Set(keys)];
  const values = await fetchContentBlockValues(unique).catch(
    () => ({} as Record<string, ContentBlockValue>),
  );
  const result: Record<string, LinkButton> = {};
  for (const key of keys) {
    result[key] = normalizeLinkButton(
      values[key],
      defaultLinkButtonForKey(key),
    );
  }
  return result;
}

/**
 * Ensure every registered block exists. Also upgrades legacy text CTA rows
 * to linkbutton shape without wiping custom labels.
 */
export async function ensureContentBlocks(): Promise<{
  created: number;
  upgraded: number;
}> {
  const existing = await getDb().select().from(contentBlocks);
  const byKey = new Map(existing.map((row) => [row.key, row]));
  let created = 0;
  let upgraded = 0;

  for (const def of CONTENT_BLOCK_DEFS) {
    const row = byKey.get(def.key);
    if (!row) {
      await getDb().insert(contentBlocks).values({
        key: def.key,
        label: def.label,
        group: def.group,
        type: def.type,
        value: def.defaultValue,
      });
      created += 1;
      continue;
    }

    if (def.type !== "linkbutton") continue;

    const defaults = isLinkButtonValue(def.defaultValue)
      ? def.defaultValue
      : { label: "", href: "/", enabled: true };
    const next = normalizeLinkButton(row.value, defaults);
    const needsType = row.type !== "linkbutton";
    const isLegacyText =
      !!row.value &&
      typeof row.value === "object" &&
      "text" in row.value &&
      !("href" in row.value);

    if (needsType || isLegacyText) {
      await getDb()
        .update(contentBlocks)
        .set({
          type: "linkbutton",
          label: def.label,
          group: def.group,
          value: next,
          updatedAt: new Date(),
        })
        .where(eq(contentBlocks.key, def.key));
      upgraded += 1;
    }
  }

  return { created, upgraded };
}

export async function getAdminContentBlocks() {
  await ensureContentBlocks();
  return getDb()
    .select()
    .from(contentBlocks)
    .orderBy(asc(contentBlocks.group), asc(contentBlocks.label));
}

export async function updateContentBlockValue(
  key: string,
  value: ContentBlockValue,
) {
  const [row] = await getDb()
    .update(contentBlocks)
    .set({ value, updatedAt: new Date() })
    .where(eq(contentBlocks.key, key))
    .returning();
  return row ?? null;
}
