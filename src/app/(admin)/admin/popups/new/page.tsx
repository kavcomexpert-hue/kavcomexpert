import { requirePageRoles } from "@/lib/admin/session";
import { PopupEditor } from "@/components/admin/popup-editor";

export default async function NewPopupPage() {
  await requirePageRoles(["admin", "editor"]);

  return (
    <PopupEditor
      initialData={{
        name: "",
        status: "paused",
        type: "exit-intent",
        delaySeconds: 5,
        scrollPercent: 60,
        pagesText: "",
        devices: "all",
        frequency: "once-per-session",
        priority: 0,
        heading: "",
        body: "",
        imageUrl: "",
        ctaLabel: "",
        ctaHref: "",
        formEnabled: false,
        formSource: "",
        displayFrom: "",
        displayUntil: "",
      }}
    />
  );
}
