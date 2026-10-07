import { NextRequest, NextResponse } from "next/server";
import {
  getAllHistory,
  getCurrentWeekRecord,
  getFuelTimeSeries,
  getHistoryDescending,
  getWeeklySummary,
} from "@/lib/services/fuel-service";
import { FuelId } from "@/lib/types/fuel";

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
          fuel: fuelFilter,
          currentPrice: summary.currentWeek.prices[fuelFilter] ?? null,
          series,
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const responsePayload: Record<string, unknown> = {
      summary,
      current: getCurrentWeekRecord(),
    };

    if (includeHistory) {
      responsePayload.history = getHistoryDescending().slice(0, weeksLimit);
    }

    return NextResponse.json(responsePayload, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
