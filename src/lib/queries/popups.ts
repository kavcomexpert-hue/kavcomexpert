import { getDb } from "@/lib/db";
import {
  popups,
  type PopupAudience,
  type PopupContent,
  type PopupTrigger,
} from "@/lib/db/schema";
import { and, asc, desc, eq, gte, isNull, lte, or } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export type PublicPopup = {
  id: string;
  name: string;
  type: string;
  trigger: PopupTrigger;
  audience: PopupAudience;
  frequency: string;
  priority: number;
  content: PopupContent;
};

const EXIT_INTENT_SEED = {
  name: "Blog exit-intent checklist",
  status: "active" as const,
  type: "exit-intent" as const,
  trigger: {} as PopupTrigger,
  audience: {
    pages: ["/blog/*"],
    devices: "desktop" as const,
  },
  frequency: "once-per-session" as const,
  priority: 10,
  content: {
    heading: "Website Growth Checklist",
    body: "Quick wins to improve conversion, credibility, and discoverability on your marketing site.",
    formEnabled: true,
    formSource: "popup:Blog exit-intent checklist",
    ctaLabel: "Send me the checklist",
  } satisfies PopupContent,
};

const CASE_STUDY_SEED = {
  name: "Case study scroll CTA",
  status: "active" as const,
  type: "scroll-percentage" as const,
  trigger: { scrollPercent: 60 } as PopupTrigger,
  audience: {
    pages: ["/work/*", "/case-studies/*"],
    devices: "all" as const,
  },
  frequency: "once-per-session" as const,
  priority: 5,
  content: {
    heading: "Want results like this?",
    body: "Book a call and we will map a plan for your firm.",
    ctaLabel: "Book a call",
    ctaHref: "/contact-us",
    formEnabled: false,
  } satisfies PopupContent,
};

export async function ensureSeedPopups(): Promise<{ created: number }> {
  const existing = await getDb().select({ name: popups.name }).from(popups);
  const names = new Set(existing.map((row) => row.name));
  let created = 0;

  for (const seed of [EXIT_INTENT_SEED, CASE_STUDY_SEED]) {
    if (names.has(seed.name)) continue;
    await getDb().insert(popups).values(seed);
    created += 1;
  }

  return { created };
}

async function fetchActivePopups(): Promise<PublicPopup[]> {
  const now = new Date();
  const rows = await getDb()
    .select()
    .from(popups)
    .where(
      and(
        eq(popups.status, "active"),
        or(isNull(popups.displayFrom), lte(popups.displayFrom, now)),
        or(isNull(popups.displayUntil), gte(popups.displayUntil, now)),
      ),
    )
    .orderBy(desc(popups.priority), asc(popups.name));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    trigger: row.trigger ?? {},
    audience: row.audience ?? {},
    frequency: row.frequency,
    priority: row.priority,
    content: row.content ?? { heading: "", body: "" },
  }));
}

export function getActivePopups() {
  return unstable_cache(
    async () => {
      try {
        return await fetchActivePopups();
      } catch (error) {
        console.warn("[popups] active fetch failed; returning none.", error);
        return [] as PublicPopup[];
      }
    },
    ["popups-active-v1"],
    { tags: ["popups"] },
  )();
}

export async function getAdminPopups() {
  await ensureSeedPopups();
  return getDb().select().from(popups).orderBy(desc(popups.priority), asc(popups.name));
}

export async function getAdminPopupById(id: string) {
  const [row] = await getDb().select().from(popups).where(eq(popups.id, id)).limit(1);
  return row ?? null;
}
