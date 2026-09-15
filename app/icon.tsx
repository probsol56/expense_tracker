import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#16211B",
          borderRadius: 7,
          color: "#EDE3C8",
          fontSize: 20,
          fontWeight: 600,
          fontFamily: "Georgia, serif",
        }}
      >
        W
      </div>
    ),
    { ...size }
  );
}
