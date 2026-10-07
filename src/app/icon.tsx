import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 36,
          background: "linear-gradient(135deg, #1d4ed8 0%, #0f172a 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "16px",
          border: "2px solid rgba(59, 130, 246, 0.5)",
        }}
      >
        ⛽
      </div>
    ),
    {
      ...size,
    }
  );
}
