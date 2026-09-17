import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "CPA Marketing Agency Houston | Kavcom Expert";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#fafaf8",
          padding: "64px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            width: 96,
            height: 8,
            background: "#14996e",
            borderRadius: 999,
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 24,
              color: "#6e6e73",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Houston CPA Firms
          </div>
          <div
            style={{
              fontSize: 56,
              lineHeight: 1.05,
              fontWeight: 700,
              color: "#1d1d1f",
              letterSpacing: "-0.03em",
              maxWidth: 980,
            }}
          >
            Marketing and Back Office Support for Houston CPA Firms
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div style={{ fontSize: 26, color: "#14996e", fontWeight: 600 }}>
            kavcomexpert.com
          </div>
          <div style={{ fontSize: 22, color: "#6e6e73" }}>
            From $850 / month
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
