import { requirePageRoles } from "@/lib/admin/session";
import {
  PopupEditor,
  type PopupEditorData,
} from "@/components/admin/popup-editor";
import { getAdminPopupById } from "@/lib/queries/popups";
import { notFound } from "next/navigation";

type PageProps = { params: Promise<{ id: string }> };

function toDatetimeLocal(value: Date | null | undefined): string {
  if (!value) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

export default async function EditPopupPage({ params }: PageProps) {
  await requirePageRoles(["admin", "editor"]);

  const { id } = await params;
  const row = await getAdminPopupById(id);
  if (!row) notFound();

  const type = (
    ["exit-intent", "timed", "scroll-percentage", "slide-in"] as const
  ).includes(row.type as PopupEditorData["type"])
    ? (row.type as PopupEditorData["type"])
    : "exit-intent";

  const frequency = (
    [
      "once-per-session",
      "once-per-visitor-30d",
      "every-visit",
    ] as const
  ).includes(row.frequency as PopupEditorData["frequency"])
    ? (row.frequency as PopupEditorData["frequency"])
    : "once-per-session";

  const devices =
    row.audience?.devices === "desktop" || row.audience?.devices === "mobile"
      ? row.audience.devices
      : "all";

  const initialData: PopupEditorData = {
    id: row.id,
    name: row.name,
    status: row.status === "active" ? "active" : "paused",
    type,
    delaySeconds: row.trigger?.delaySeconds ?? 5,
    scrollPercent: row.trigger?.scrollPercent ?? 60,
    pagesText: (row.audience?.pages ?? []).join("\n"),
    devices,
    frequency,
    priority: row.priority,
    heading: row.content?.heading ?? "",
    body: row.content?.body ?? "",
    imageUrl: row.content?.imageUrl ?? "",
    ctaLabel: row.content?.ctaLabel ?? "",
    ctaHref: row.content?.ctaHref ?? "",
    formEnabled: Boolean(row.content?.formEnabled),
    formSource: row.content?.formSource ?? "",
    displayFrom: toDatetimeLocal(row.displayFrom),
    displayUntil: toDatetimeLocal(row.displayUntil),
  };

  return <PopupEditor initialData={initialData} />;
}
