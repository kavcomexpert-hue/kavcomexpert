"use client";

import dynamic from "next/dynamic";
import type { PublicPopup } from "@/lib/queries/popups";
import { useIdleReady } from "@/hooks/use-idle-ready";

const PopupController = dynamic(
  () =>
    import("@/components/site/popups/popup-controller").then(
      (module) => module.PopupController,
    ),
  { ssr: false },
);

export function PopupControllerLoader({
  popups,
  turnstileSiteKey,
}: {
  popups: PublicPopup[];
  turnstileSiteKey?: string;
}) {
  const ready = useIdleReady({ timeoutMs: 4000 });
  if (popups.length === 0 || !ready) return null;
  return (
    <PopupController popups={popups} turnstileSiteKey={turnstileSiteKey} />
  );
}
