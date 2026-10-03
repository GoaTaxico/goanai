import { ImageResponse } from "next/og";

export const alt = "Susegad — free chat in English, Hindi, and Hinglish";
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
          background: "#f4ecdf",
          color: "#08343c",
          padding: "72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              background: "#08343c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 24,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                background: "#f0a03a",
              }}
            />
          </div>
          <div style={{ display: "flex", fontSize: 32, color: "#0e7480" }}>A free chat app for India</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 96, lineHeight: 1 }}>Susegad</div>
          <div style={{ display: "flex", fontSize: 40, marginTop: 24 }}>
            Ask in English, Hindi, or Hinglish.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            height: 8,
            width: 220,
            borderRadius: 8,
            background: "#e8942a",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
