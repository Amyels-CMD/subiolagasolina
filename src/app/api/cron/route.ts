import { NextRequest, NextResponse } from "next/server";
import { syncFuelData } from "@/lib/services/ingestion";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncFuelData();
  return NextResponse.json({
    triggeredBy: "Vercel Cron",
    result,
  });
}
