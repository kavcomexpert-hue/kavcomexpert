export function readRevisionsCollapsed(storageKey: string): boolean {
  try {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(storageKey) !== "false";
  } catch {
    return true;
  }
}

export function writeRevisionsCollapsed(
  storageKey: string,
  collapsed: boolean,
): void {
  try {
    localStorage.setItem(storageKey, String(collapsed));
  } catch {
    // ignore quota / private mode
  }
}
