/**
 * Offline helper: strip white/solid backgrounds from a Lottie JSON file.
 *
 * Usage:
 *   npx tsx scripts/strip-lottie-bg.ts input.json [output.json]
 *
 * If output is omitted, writes alongside input as *.transparent.json
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { stripLottieWhiteBackground } from "../src/lib/media/strip-lottie-bg";

const inputPath = process.argv[2];
if (!inputPath) {
  console.error(
    "Usage: npx tsx scripts/strip-lottie-bg.ts <input.json> [output.json]",
  );
  process.exit(1);
}

const resolved = path.resolve(inputPath);
const raw = JSON.parse(readFileSync(resolved, "utf8")) as unknown;
const cleaned = stripLottieWhiteBackground(raw);

const outputPath = process.argv[3]
  ? path.resolve(process.argv[3])
  : resolved.replace(/\.json$/i, ".transparent.json");

writeFileSync(outputPath, `${JSON.stringify(cleaned)}\n`, "utf8");
console.log(`Wrote transparent Lottie → ${outputPath}`);
