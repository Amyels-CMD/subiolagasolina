import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getWeeklySummary } from "@/lib/services/fuel-service";
import { formatCurrency } from "@/lib/utils/format";

export const alt =
  "subiólagasolina - Precios oficiales de combustibles en República Dominicana";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

// Load the official logo mark as base64 for embedding in OpenGraph card
function getLogoBase64(): string {
  try {
    const p = path.join(process.cwd(), "public", "icon-512.png");
    if (fs.existsSync(p)) {
      return `data:image/png;base64,${fs.readFileSync(p).toString("base64")}`;
    }
  } catch {
    // fallback if filesystem access fails
  }
  return "";
}

export default function Image() {
  const summary = getWeeklySummary();
  const { currentWeek, headlineVerdict, badgeTone } = summary;
  const logoBase64 = getLogoBase64();

  const premiumPrice = currentWeek.prices["gasolina-premium"];
  const regularPrice = currentWeek.prices["gasolina-regular"];
  const glpPrice = currentWeek.prices["glp"];

  // Colors based on badgeTone
  const verdictBg =
    badgeTone === "danger"
      ? "rgba(239, 68, 68, 0.15)"
      : badgeTone === "success"
      ? "rgba(16, 185, 129, 0.15)"
      : "rgba(245, 158, 11, 0.15)";

  const verdictBorder =
    badgeTone === "danger"
      ? "rgba(239, 68, 68, 0.4)"
      : badgeTone === "success"
      ? "rgba(16, 185, 129, 0.4)"
      : "rgba(245, 158, 11, 0.4)";

  const verdictColor =
    badgeTone === "danger"
      ? "#f87171"
      : badgeTone === "success"
      ? "#34d399"
      : "#fbbf24";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "54px 64px",
          background: "linear-gradient(145deg, #050811 0%, #0a1122 55%, #050812 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#ffffff",
        }}
      >
        {/* Top Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {logoBase64 ? (
              <img
                src={logoBase64}
                width="54"
                height="54"
                style={{
                  borderRadius: "14px",
                  border: "2px solid rgba(245, 158, 11, 0.45)",
                  boxShadow: "0 6px 20px rgba(0, 0, 0, 0.6)",
                }}
              />
            ) : (
              <div
                style={{
                  width: "54px",
                  height: "54px",
                  borderRadius: "14px",
                  background: "rgba(245, 158, 11, 0.15)",
                  border: "1.5px solid rgba(245, 158, 11, 0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "28px",
                }}
              >
                ⛽
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: "32px",
                  fontWeight: 900,
                  letterSpacing: "-0.5px",
                  color: "#ffffff",
                }}
              >
                subiólagasolina
              </span>
              <span style={{ fontSize: "14px", color: "#94a3b8" }}>
                República Dominicana 🇩🇴
              </span>
            </div>
          </div>

          <div
            style={{
              padding: "10px 22px",
              borderRadius: "999px",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              fontSize: "16px",
              color: "#e2e8f0",
              fontWeight: 700,
            }}
          >
            {currentWeek.dateLabel}
          </div>
        </div>

        {/* Center: Verdict Banner with Official Brand Emblem */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            margin: "16px 0",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "14px",
              maxWidth: "780px",
            }}
          >
            <div
              style={{
                padding: "12px 26px",
                borderRadius: "16px",
                background: verdictBg,
                border: `1.5px solid ${verdictBorder}`,
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "14px",
                  height: "14px",
                  borderRadius: "999px",
                  background: verdictColor,
                  boxShadow: `0 0 12px ${verdictColor}`,
                }}
              />
              <span
                style={{
                  fontSize: "24px",
                  fontWeight: 900,
                  color: verdictColor,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                {headlineVerdict}
              </span>
            </div>

            <h1
              style={{
                fontSize: "46px",
                fontWeight: 900,
                lineHeight: 1.12,
                color: "#ffffff",
                margin: 0,
                letterSpacing: "-1px",
              }}
            >
              Precios Oficiales de Combustibles
            </h1>
          </div>

          {/* Right Emblem Badge with glowing border */}
          {logoBase64 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "136px",
                height: "136px",
                borderRadius: "26px",
                background: "#03051c",
                border: "2px solid rgba(245, 158, 11, 0.45)",
                boxShadow: "0 12px 32px rgba(0, 0, 0, 0.8), 0 0 40px rgba(245, 158, 11, 0.15)",
                padding: "8px",
              }}
            >
              <img
                src={logoBase64}
                width="116"
                height="116"
                style={{
                  borderRadius: "18px",
                }}
              />
            </div>
          ) : null}
        </div>

        {/* Key Prices 3-Card Strip */}
        <div
          style={{
            display: "flex",
            gap: "20px",
            width: "100%",
          }}
        >
          {/* Card Premium */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              padding: "20px 24px",
              borderRadius: "20px",
              background: "rgba(15, 23, 42, 0.75)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <span style={{ fontSize: "14px", color: "#94a3b8", fontWeight: 700 }}>
              Gasolina Premium
            </span>
            <span
              style={{
                fontSize: "34px",
                fontWeight: 900,
                color: "#fbbf24",
                marginTop: "6px",
              }}
            >
              {formatCurrency(premiumPrice)}
            </span>
            <span style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
              por galón
            </span>
          </div>

          {/* Card Regular */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              padding: "20px 24px",
              borderRadius: "20px",
              background: "rgba(15, 23, 42, 0.75)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <span style={{ fontSize: "14px", color: "#94a3b8", fontWeight: 700 }}>
              Gasolina Regular
            </span>
            <span
              style={{
                fontSize: "34px",
                fontWeight: 900,
                color: "#ffffff",
                marginTop: "6px",
              }}
            >
              {formatCurrency(regularPrice)}
            </span>
            <span style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
              por galón
            </span>
          </div>

          {/* Card GLP */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              padding: "20px 24px",
              borderRadius: "20px",
              background: "rgba(15, 23, 42, 0.75)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <span style={{ fontSize: "14px", color: "#94a3b8", fontWeight: 700 }}>
              Gas Licuado (GLP)
            </span>
            <span
              style={{
                fontSize: "34px",
                fontWeight: 900,
                color: "#38bdf8",
                marginTop: "6px",
              }}
            >
              {formatCurrency(glpPrice)}
            </span>
            <span style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
              por galón
            </span>
          </div>
        </div>

        {/* Bottom Footer Details */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            paddingTop: "18px",
            fontSize: "14px",
            color: "#64748b",
          }}
        >
          <span>Fuente oficial: Resoluciones MICM • Ley 112-00 de Hidrocarburos</span>
          <span style={{ color: "#38bdf8", fontWeight: 700 }}>subiolagasolina.com</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
