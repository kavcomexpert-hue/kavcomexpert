import { ImageResponse } from "next/og";

export const runtime = "edge";

const background = "#fafaf8";
const foreground = "#1d1d1f";
const accent = "#14996e";
const muted = "#6e6e73";

function siteHostLabel(): string {
  try {
    return new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://kavcomexpert.com",
    ).hostname.replace(/^www\./, "");
  } catch {
    return "kavcomexpert.com";
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title")?.trim() || "Kavcom Expert";
  const category = searchParams.get("category")?.trim() || "Blog";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background,
          padding: "64px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            width: 96,
            height: 8,
            background: accent,
            borderRadius: 999,
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 28,
              color: muted,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {category}
          </div>
          <div
            style={{
              fontSize: 64,
              lineHeight: 1.05,
              fontWeight: 700,
              color: foreground,
              letterSpacing: "-0.03em",
              maxWidth: 980,
            }}
          >
            {title}
          </div>
        </div>
        <div
          style={{
            fontSize: 28,
            color: accent,
            fontWeight: 600,
          }}
        >
          {siteHostLabel()}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
