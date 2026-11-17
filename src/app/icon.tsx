import { ImageResponse } from "next/og";

export const size = {
  width: 48,
  height: 48,
};
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
          background: "#080c14",
          borderRadius: "10px",
          border: "2px solid rgba(245, 158, 11, 0.45)",
        }}
      >
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="3" y1="22" x2="15" y2="22" />
          <line x1="4" y1="9" x2="14" y2="9" />
          <path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18" />
          <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
