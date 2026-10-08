import { NextResponse } from "next/server";
import { syncFuelData } from "@/lib/services/ingestion";

export async function GET() {
  const result = await syncFuelData();
  return NextResponse.json(result);
}

export async function POST() {
  const result = await syncFuelData();
  return NextResponse.json(result);
}
