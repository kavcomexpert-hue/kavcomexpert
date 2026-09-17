/**
 * Production preflight checks.
 * Run: npx tsx scripts/preflight.ts
 * Exit 1 on any required *runtime* failure.
 *
 * Build-time: Next can compile without DATABASE_URL (lazy DB + empty static params).
 * Runtime: DATABASE_URL and other secrets are required for the live site.
 */
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

for (const file of [
  ".env.production.local",
  ".env.production",
  ".env.local",
  ".env",
]) {
  const path = resolve(process.cwd(), file);
  if (existsSync(path)) {
    config({ path, quiet: true });
  }
}

type Phase = "build" | "runtime" | "both";

type Check = {
  name: string;
  ok: boolean;
  detail: string;
  /** Fail the script when missing */
  requiredForRuntime: boolean;
  phase: Phase;
};

const runtimeRequiredKeys = [
  "NEXT_PUBLIC_SITE_URL",
  "BETTER_AUTH_URL",
  "BETTER_AUTH_SECRET",
  "DATABASE_URL",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
  "R2_PUBLIC_URL",
  "RESEND_API_KEY",
] as const;

/** Useful at build but not fatal if absent (lazy DB / soft static params). */
const buildOptionalKeys = ["DATABASE_URL"] as const;

const optionalKeys = [
  "INDEXNOW_KEY",
  "NEXT_PUBLIC_GA_ID",
  "NEXT_PUBLIC_CLARITY_ID",
  "GOOGLE_SERVICE_ACCOUNT_EMAIL",
  "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY",
  "CRON_SECRET",
  "RESEND_FROM_EMAIL",
  "LEAD_NOTIFY_EMAIL",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "TURNSTILE_SECRET_KEY",
] as const;

const checks: Check[] = [];
const missingRuntime: string[] = [];
const missingBuildHint: string[] = [];

for (const key of runtimeRequiredKeys) {
  const value = process.env[key]?.trim() ?? "";
  const present = value.length > 0;
  if (!present) missingRuntime.push(key);
  checks.push({
    name: key,
    ok: present,
    detail: present ? "present" : "MISSING",
    requiredForRuntime: true,
    phase: key === "DATABASE_URL" ? "both" : "runtime",
  });
}

for (const key of buildOptionalKeys) {
  const value = process.env[key]?.trim() ?? "";
  if (!value) missingBuildHint.push(key);
}

for (const key of optionalKeys) {
  const value = process.env[key]?.trim() ?? "";
  checks.push({
    name: key,
    ok: true,
    detail: value ? "present" : "optional (empty)",
    requiredForRuntime: false,
    phase: "runtime",
  });
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "";
let siteUrlOk = false;
let siteUrlDetail = "MISSING";
try {
  const url = new URL(siteUrl);
  siteUrlOk =
    url.protocol === "https:" &&
    url.hostname !== "localhost" &&
    !url.hostname.endsWith(".local");
  siteUrlDetail = siteUrlOk
    ? url.origin
    : `must be https and not localhost (got ${siteUrl || "empty"})`;
} catch {
  siteUrlDetail = `invalid URL: ${siteUrl || "empty"}`;
}
checks.push({
  name: "NEXT_PUBLIC_SITE_URL format",
  ok: siteUrlOk,
  detail: siteUrlDetail,
  requiredForRuntime: true,
  phase: "runtime",
});
if (!siteUrlOk) missingRuntime.push("NEXT_PUBLIC_SITE_URL (format)");

const dbUrl = process.env.DATABASE_URL?.trim() ?? "";
const looksDevBranch =
  /[-_](dev|development|preview|staging|test)\b/i.test(dbUrl) ||
  /branch[=-]dev/i.test(dbUrl);
const dbBranchOk = Boolean(dbUrl) && !looksDevBranch;
checks.push({
  name: "DATABASE_URL not a dev branch",
  ok: dbBranchOk,
  detail: !dbUrl
    ? "MISSING"
    : looksDevBranch
      ? "looks like a non-production branch name"
      : "ok",
  requiredForRuntime: true,
  phase: "runtime",
});
if (!dbBranchOk) missingRuntime.push("DATABASE_URL (prod branch)");

const secret = process.env.BETTER_AUTH_SECRET?.trim() ?? "";
const secretOk = secret.length >= 32;
checks.push({
  name: "BETTER_AUTH_SECRET length",
  ok: secretOk,
  detail: secret ? `${secret.length} chars (need >= 32)` : "MISSING",
  requiredForRuntime: true,
  phase: "runtime",
});
if (!secretOk) missingRuntime.push("BETTER_AUTH_SECRET (length)");

checks.push({
  name: "Build without DATABASE_URL",
  ok: true,
  detail:
    "Supported: lazy getDb() + empty generateStaticParams on DB failure",
  requiredForRuntime: false,
  phase: "build",
});

const nameWidth = Math.max(...checks.map((c) => c.name.length), 24);

console.log("\nPreflight (build vs runtime)\n");
console.log("Phase legend: build = compile-time  |  runtime = live server\n");

for (const check of checks) {
  const mark = check.ok
    ? "PASS"
    : check.requiredForRuntime
      ? "FAIL"
      : "WARN";
  console.log(
    `${mark.padEnd(4)}  [${check.phase.padEnd(7)}]  ${check.name.padEnd(nameWidth)}  ${check.detail}`,
  );
}

if (missingBuildHint.length > 0) {
  console.log(
    `\nBuild note: missing ${missingBuildHint.join(", ")} — ` +
      `npm run build can still succeed; pages that need the DB will ISR at runtime.`,
  );
}

if (missingRuntime.length > 0) {
  console.log("\nMissing runtime variables (by name):");
  for (const name of missingRuntime) {
    console.log(`  - ${name}`);
  }
}

const failed = checks.filter((c) => c.requiredForRuntime && !c.ok);
console.log(
  `\n${
    failed.length === 0
      ? "All runtime-required checks passed."
      : `${failed.length} runtime-required check(s) failed.`
  }\n`,
);
process.exit(failed.length === 0 ? 0 : 1);
