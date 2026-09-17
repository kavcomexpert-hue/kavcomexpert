/**
 * Remap Lottie fill/stroke colors toward Kavcom brand greens / neutrals.
 * Keeps near-white/black/transparent; maps chromatic hues into accent range.
 */

export type LottieBrandPalette = {
  /** Primary brand green (0–1 RGB). */
  accent: [number, number, number];
  /** Secondary / highlight green. */
  accentLime: [number, number, number];
  /** Dark line / text color. */
  foreground: [number, number, number];
  /** Soft muted strokes. */
  muted: [number, number, number];
};

/** Default light-theme brand palette (matches globals.css). */
export const LOTTIE_BRAND_LIGHT: LottieBrandPalette = {
  accent: hexToRgb01("#14996e"),
  accentLime: hexToRgb01("#2dd4a0"),
  foreground: hexToRgb01("#1d1d1f"),
  muted: hexToRgb01("#6e6e73"),
};

/** Dark-theme brand palette. */
export const LOTTIE_BRAND_DARK: LottieBrandPalette = {
  accent: hexToRgb01("#3ecf9a"),
  accentLime: hexToRgb01("#6ee7b7"),
  foreground: hexToRgb01("#f5f5f7"),
  muted: hexToRgb01("#a1a1a6"),
};

function hexToRgb01(hex: string): [number, number, number] {
  const raw = hex.replace("#", "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  return [
    parseInt(full.slice(0, 2), 16) / 255,
    parseInt(full.slice(2, 4), 16) / 255,
    parseInt(full.slice(4, 6), 16) / 255,
  ];
}

function rgbToHsl(
  r: number,
  g: number,
  b: number,
): { h: number; s: number; l: number } {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h, s, l };
}

function mapColor(
  r: number,
  g: number,
  b: number,
  palette: LottieBrandPalette,
): [number, number, number] {
  const { h, s, l } = rgbToHsl(r, g, b);

  // Near-white / near-black / grey → neutrals (preserve structure)
  if (s < 0.08) {
    if (l > 0.92) return [r, g, b]; // leave (often highlights / bg leftovers)
    if (l < 0.18) return palette.foreground;
    return palette.muted;
  }

  // Light pastel accents → lime
  if (l > 0.72) {
    return mix(palette.accentLime, [r, g, b], 0.15);
  }

  // Dark saturated → deep accent with original lightness bias
  if (l < 0.35) {
    return [
      palette.accent[0] * (0.55 + l * 0.6),
      palette.accent[1] * (0.55 + l * 0.6),
      palette.accent[2] * (0.55 + l * 0.6),
    ];
  }

  // Blues / purples / oranges / reds → brand accent (hue-agnostic remap)
  // Greens already near brand: nudge toward accent
  const isGreenish = h > 0.25 && h < 0.45;
  if (isGreenish) {
    return mix(palette.accent, [r, g, b], 0.35);
  }

  return mix(palette.accent, palette.accentLime, l > 0.55 ? 0.55 : 0.2);
}

function mix(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    a[0] * (1 - t) + b[0] * t,
    a[1] * (1 - t) + b[1] * t,
    a[2] * (1 - t) + b[2] * t,
  ];
}

function remapRgbArray(
  arr: unknown,
  palette: LottieBrandPalette,
): unknown {
  if (!Array.isArray(arr) || arr.length < 3) return arr;
  const r = Number(arr[0]);
  const g = Number(arr[1]);
  const b = Number(arr[2]);
  if (![r, g, b].every((n) => Number.isFinite(n))) return arr;
  // Lottie uses 0–1 floats; some files use 0–255
  const scale = r > 1 || g > 1 || b > 1 ? 255 : 1;
  const rn = r / scale;
  const gn = g / scale;
  const bn = b / scale;
  const [mr, mg, mb] = mapColor(rn, gn, bn, palette);
  if (scale === 255) {
    return [Math.round(mr * 255), Math.round(mg * 255), Math.round(mb * 255), ...(arr.slice(3) as number[])];
  }
  return [mr, mg, mb, ...arr.slice(3)];
}

function remapHexSolid(sc: unknown, palette: LottieBrandPalette): unknown {
  if (typeof sc !== "string") return sc;
  const raw = sc.trim().replace(/^#/, "");
  let hex = raw;
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    hex = raw
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (!/^[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(hex)) return sc;
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const [mr, mg, mb] = mapColor(r, g, b, palette);
  const toHex = (n: number) =>
    Math.round(n * 255)
      .toString(16)
      .padStart(2, "0");
  const alpha = hex.length === 8 ? hex.slice(6, 8) : "";
  return `#${toHex(mr)}${toHex(mg)}${toHex(mb)}${alpha}`;
}

function walk(node: unknown, palette: LottieBrandPalette): unknown {
  if (Array.isArray(node)) {
    return node.map((item) => walk(item, palette));
  }
  if (!node || typeof node !== "object") return node;

  const obj = node as Record<string, unknown>;
  const next: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Solid layer color
    if (key === "sc" && typeof value === "string") {
      next[key] = remapHexSolid(value, palette);
      continue;
    }

    // Shape fill/stroke color: { ty: "fl"|"st", c: { a: 0, k: [r,g,b,a] } }
    if (
      key === "c" &&
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      "k" in (value as object)
    ) {
      const color = value as Record<string, unknown>;
      if (Array.isArray(color.k) && typeof color.k[0] === "number") {
        next[key] = { ...color, k: remapRgbArray(color.k, palette) };
        continue;
      }
      // Animated color keyframes: k is array of { s: [r,g,b,a], t, ... }
      if (Array.isArray(color.k)) {
        next[key] = {
          ...color,
          k: color.k.map((frame) => {
            if (frame && typeof frame === "object" && !Array.isArray(frame)) {
              const f = frame as Record<string, unknown>;
              if (Array.isArray(f.s)) {
                return { ...f, s: remapRgbArray(f.s, palette) };
              }
            }
            return frame;
          }),
        };
        continue;
      }
    }

    next[key] = walk(value, palette);
  }

  return next;
}

export function recolorLottieToBrand(
  data: unknown,
  palette: LottieBrandPalette = LOTTIE_BRAND_LIGHT,
): Record<string, unknown> {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Invalid Lottie JSON");
  }
  return walk(structuredClone(data), palette) as Record<string, unknown>;
}
