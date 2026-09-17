/**
 * Strip solid / named white backgrounds from Lottie JSON so animations
 * composite transparently over the site (no white square).
 */

function parseHexColor(sc: unknown): { r: number; g: number; b: number } | null {
  if (typeof sc !== "string") return null;
  const raw = sc.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    return {
      r: parseInt(raw[0]! + raw[0]!, 16),
      g: parseInt(raw[1]! + raw[1]!, 16),
      b: parseInt(raw[2]! + raw[2]!, 16),
    };
  }
  if (/^[0-9a-fA-F]{6}$/.test(raw)) {
    return {
      r: parseInt(raw.slice(0, 2), 16),
      g: parseInt(raw.slice(2, 4), 16),
      b: parseInt(raw.slice(4, 6), 16),
    };
  }
  if (/^[0-9a-fA-F]{8}$/.test(raw)) {
    return {
      r: parseInt(raw.slice(0, 2), 16),
      g: parseInt(raw.slice(2, 4), 16),
      b: parseInt(raw.slice(4, 6), 16),
    };
  }
  return null;
}

function isNearWhiteRgb(r: number, g: number, b: number): boolean {
  // Treat light greys / off-whites as background too
  return r >= 245 && g >= 245 && b >= 245;
}

function isWhiteSolidColor(sc: unknown): boolean {
  const rgb = parseHexColor(sc);
  if (!rgb) return false;
  return isNearWhiteRgb(rgb.r, rgb.g, rgb.b);
}

function layerNameLooksLikeBackground(name: unknown): boolean {
  if (typeof name !== "string") return false;
  const n = name.trim().toLowerCase();
  return (
    n === "bg" ||
    n === "background" ||
    n === "backdrop" ||
    n.includes("background") ||
    n.includes("white bg") ||
    n.includes("whitebg") ||
    n.endsWith("_bg") ||
    n.startsWith("bg_")
  );
}

function isSolidWhiteLayer(layer: Record<string, unknown>): boolean {
  // ty: 1 = solid layer
  if (layer.ty === 1 && isWhiteSolidColor(layer.sc)) return true;
  if (layerNameLooksLikeBackground(layer.nm) && layer.ty === 1) return true;
  return false;
}

/**
 * Returns a new Lottie object with white/solid background layers removed.
 * Also clears known bg metadata fields when present.
 */
export function stripLottieWhiteBackground(
  data: unknown,
): Record<string, unknown> {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Invalid Lottie JSON");
  }

  const root = structuredClone(data) as Record<string, unknown>;

  if (Array.isArray(root.layers)) {
    root.layers = root.layers.filter((layer) => {
      if (!layer || typeof layer !== "object") return true;
      return !isSolidWhiteLayer(layer as Record<string, unknown>);
    });
  }

  // Nested assets (precomps) can also carry bg solids
  if (Array.isArray(root.assets)) {
    root.assets = root.assets.map((asset) => {
      if (!asset || typeof asset !== "object") return asset;
      const a = asset as Record<string, unknown>;
      if (!Array.isArray(a.layers)) return a;
      return {
        ...a,
        layers: a.layers.filter((layer) => {
          if (!layer || typeof layer !== "object") return true;
          return !isSolidWhiteLayer(layer as Record<string, unknown>);
        }),
      };
    });
  }

  // Some exporters stash a bg color
  if ("bg" in root) delete root.bg;
  if (root.meta && typeof root.meta === "object" && !Array.isArray(root.meta)) {
    const meta = { ...(root.meta as Record<string, unknown>) };
    delete meta.bg;
    delete meta.background;
    root.meta = meta;
  }

  return root;
}

export function isLottieJsonBuffer(buffer: Buffer): boolean {
  try {
    const text = buffer.toString("utf8").trim();
    if (!text.startsWith("{")) return false;
    const parsed = JSON.parse(text) as Record<string, unknown>;
    return (
      typeof parsed === "object" &&
      parsed !== null &&
      (Array.isArray(parsed.layers) || typeof parsed.v === "string")
    );
  } catch {
    return false;
  }
}

/**
 * If buffer is Lottie JSON, strip white backgrounds and return UTF-8 bytes.
 * Otherwise return the original buffer unchanged.
 */
export function maybeStripLottieBackground(buffer: Buffer): Buffer {
  if (!isLottieJsonBuffer(buffer)) return buffer;
  const parsed = JSON.parse(buffer.toString("utf8")) as unknown;
  const cleaned = stripLottieWhiteBackground(parsed);
  return Buffer.from(JSON.stringify(cleaned), "utf8");
}
