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

export default function Image() {
  const summary = getWeeklySummary();
  const { currentWeek, headlineVerdict, badgeTone } = summary;

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
          padding: "60px 70px",
          background: "linear-gradient(145deg, #070b14 0%, #0d1527 60%, #080c16 100%)",
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
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background: "rgba(245, 158, 11, 0.15)",
                border: "1.5px solid rgba(245, 158, 11, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "26px",
              }}
            >
              ⛽
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: "30px",
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
              padding: "10px 20px",
              borderRadius: "999px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              fontSize: "16px",
              color: "#cbd5e1",
              fontWeight: 600,
            }}
          >
            {currentWeek.dateLabel}
          </div>
        </div>

        {/* Center: Verdict Banner */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "14px",
            margin: "24px 0",
          }}
        >
          <div
            style={{
              padding: "12px 24px",
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
                width: "12px",
                height: "12px",
                borderRadius: "999px",
                background: verdictColor,
              }}
            />
            <span
              style={{
                fontSize: "22px",
                fontWeight: 800,
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
              lineHeight: 1.15,
              color: "#ffffff",
              margin: 0,
              letterSpacing: "-1px",
            }}
          >
            Precios Oficiales de Combustibles
          </h1>
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
            paddingTop: "20px",
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
