import { NextRequest, NextResponse } from "next/server";
import {
  getCurrentWeekRecord,
  getFuelTimeSeries,
  getHistoryDescending,
  getWeeklySummary,
} from "@/lib/services/fuel-service";
import { FuelId } from "@/lib/types/fuel";
import { SITE_CONFIG } from "@/lib/constants/site";

const API_META = {
  attribution: "subiólagasolina • Precios oficiales de combustibles en República Dominicana",
  canonical: SITE_CONFIG.url,
  license: "CC BY 4.0 (Uso libre con atribución)",
  supportUs: SITE_CONFIG.buyMeACoffeeUrl,
  officialSource: "Ministerio de Industria, Comercio y Mipymes (MICM, Ley 112-00)",
  updatedWeekly: "Viernes ~1:00 PM AST (UTC-4)",
  scopeExplanation: {
    primaryQuestion: "El titular '¿Subió la gasolina?' evalúa exclusivamente Gasolina Premium y Gasolina Regular.",
    gasoline: "Exclusivo Gasolinas (Premium y Regular).",
    consumer: "Combustibles de consumo masivo (Gasolinas, Gasoil Óptimo/Regular, GLP y Gas Natural).",
    market: "Mercado total oficial publicado por el MICM (incluye derivados industriales y de aviación).",
  },
};

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CACHE_HEADERS,
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get("history") === "true";
    const weeksLimit = parseInt(searchParams.get("weeks") || "26", 10);
    const fuelFilter = searchParams.get("fuel") as FuelId | null;

    const summary = getWeeklySummary();

    if (fuelFilter) {
      const series = getFuelTimeSeries(fuelFilter, weeksLimit);
      return NextResponse.json(
        {
          _meta: API_META,
          fuel: fuelFilter,
          currentPrice: summary.currentWeek.prices[fuelFilter] ?? null,
          series,
        },
        {
          headers: CACHE_HEADERS,
        }
      );
    }

    const responsePayload: Record<string, unknown> = {
      _meta: API_META,
      verdict: summary.verdicts.gasoline,
      scopes: summary.scopes,
      hasNotableOtherChanges: summary.hasNotableOtherChanges,
      hasOtherConsumerChanges: summary.hasOtherConsumerChanges,
      hasIndustrialChanges: summary.hasIndustrialChanges,
      notableChangeSummary: summary.notableChangeSummary,
      changes: summary.changes,
      summary,
      current: summary.currentWeek,
      previous: summary.previousWeek,
      nextUpdateDate: summary.nextUpdateDate,
      nextUpdateDateDominican: summary.nextUpdateDateDominican,
    };


    if (includeHistory) {
      responsePayload.history = getHistoryDescending().slice(0, weeksLimit);
    }

    return NextResponse.json(responsePayload, {
      headers: CACHE_HEADERS,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

