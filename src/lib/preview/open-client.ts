/**
 * Opens a preview tab without losing the user gesture.
 * Browsers block window.open() after an await; open a blank tab first,
 * then navigate it once the preview URL is ready.
 */
import { absoluteUrl } from "@/lib/seo/constants";

export async function openPreviewFromAction(
  create: () => Promise<
    { success: true; url: string } | { success: false; error: string }
  >,
): Promise<{ success: true } | { success: false; error: string }> {
  const tab = window.open("about:blank", "_blank");

  try {
    const result = await create();
    if (!result.success) {
      tab?.close();
      return { success: false, error: result.error };
    }

    const href = absoluteUrl(result.url);

    if (tab && !tab.closed) {
      tab.location.href = href;
    } else {
      // Popup blocked — navigate current tab as a last resort.
      window.location.assign(href);
    }

    return { success: true };
  } catch {
    tab?.close();
    return { success: false, error: "Could not open preview" };
  }
}
