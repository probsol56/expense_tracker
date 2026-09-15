import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#16211B",
          color: "#EDE3C8",
        }}
      >
        <div
          style={{
            fontSize: 28,
            letterSpacing: 12,
            fontWeight: 600,
            color: "#B4903F",
            fontFamily: "Georgia, serif",
          }}
        >
          WALLO
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 56,
            fontWeight: 600,
            fontFamily: "Georgia, serif",
            textAlign: "center",
          }}
        >
          Personal Finance, Elevated
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 24,
            color: "rgba(237, 227, 200, 0.7)",
          }}
        >
          A calmer, premium way to track and understand your money.
        </div>
      </div>
    ),
    { ...size }
  );
}
