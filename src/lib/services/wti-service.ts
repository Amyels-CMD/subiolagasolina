import fs from "fs";
import path from "path";
import { WtiBenchmark } from "@/lib/types/fuel";

const WTI_PATH = path.resolve(process.cwd(), "src", "data", "wti-benchmark.json");

const DEFAULT_WTI: WtiBenchmark = {
  priceUsd: 91.85,
  changeUsd: 2.42,
  percentageChange: 2.71,
  trend: "up",
  label: "Crudo WTI • Texas (Ref. Internacional)",
  updatedAt: new Date().toISOString(),
};

/**
 * Obtiene el benchmark del Crudo WTI (Texas) persistido
 */
export function getWtiBenchmark(): WtiBenchmark {
  try {
    if (fs.existsSync(WTI_PATH)) {
      const raw = fs.readFileSync(WTI_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (typeof parsed.priceUsd === "number" && !isNaN(parsed.priceUsd)) {
        return parsed as WtiBenchmark;
      }
    }
  } catch (err) {
    console.warn("No se pudo leer wti-benchmark.json, usando valor por defecto:", err);
  }
  return DEFAULT_WTI;
}

/**
 * Consulta en tiempo real la cotización oficial del Crudo WTI (CL=F en NYMEX)
 * y actualiza el archivo persistente si el entorno lo permite.
 */
export async function fetchLiveWti(): Promise<WtiBenchmark> {
  try {
    const res = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/CL=F?interval=1d&range=5d",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) {
      throw new Error(`Respuesta no satisfactoria de cotización WTI: HTTP ${res.status}`);
    }

    const data = await res.json();
    const result = data.chart?.result?.[0];
    if (!result) {
      throw new Error("Estructura de respuesta de mercado sin resultados");
    }

    const meta = result.meta;
    const rawQuotes = (result.indicators?.quote?.[0]?.close as (number | null)[]) || [];
    const quotes = rawQuotes.filter((v): v is number => typeof v === "number" && !isNaN(v));

    const currentPrice = meta?.regularMarketPrice || quotes[quotes.length - 1];
    const prevPrice = meta?.chartPreviousClose || quotes[0] || currentPrice;

    if (!currentPrice || isNaN(currentPrice)) {
      throw new Error("Precio spot de WTI inválido");
    }

    const changeUsd = Math.round((currentPrice - prevPrice) * 100) / 100;
    const percentageChange =
      prevPrice > 0
        ? Math.round(((currentPrice - prevPrice) / prevPrice) * 10000) / 100
        : 0;

    const trend = changeUsd > 0 ? "up" : changeUsd < 0 ? "down" : "unchanged";

    const benchmark: WtiBenchmark = {
      priceUsd: Math.round(currentPrice * 100) / 100,
      changeUsd,
      percentageChange,
      trend,
      label: "Crudo WTI • Texas (Ref. Internacional)",
      updatedAt: new Date().toISOString(),
    };

    try {
      if (fs.existsSync(WTI_PATH)) {
        fs.writeFileSync(WTI_PATH, JSON.stringify(benchmark, null, 2), "utf-8");
      }
    } catch {
      // Ignorar en entornos serverless con sistema de archivos de solo lectura
    }

    return benchmark;
  } catch (err) {
    console.warn("Fallo al consultar cotización en vivo de WTI, usando caché persistente:", err);
    return getWtiBenchmark();
  }
}
