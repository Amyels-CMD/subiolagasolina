import rawHistory from "@/data/fuel-history.json";
import { CONSUMER_FUELS, FUELS_META, INDUSTRIAL_FUELS } from "@/lib/constants/fuels";
import {
  FuelId,
  FuelPriceItem,
  TankCalculationResult,
  WeeklyFuelRecord,
  WeeklySummary,
} from "@/lib/types/fuel";
import { getNextAnnouncementDate } from "@/lib/utils/date-rd";
import { formatMillions } from "@/lib/utils/format";

// Cache sorted historical records in memory
const sortedHistory: WeeklyFuelRecord[] = (rawHistory as WeeklyFuelRecord[])
  .slice()
  .sort((a, b) => a.startDate.localeCompare(b.startDate));

export function getAllHistory(): WeeklyFuelRecord[] {
  return sortedHistory;
}

export function getHistoryDescending(): WeeklyFuelRecord[] {
  return [...sortedHistory].reverse();
}

export function getCurrentWeekRecord(): WeeklyFuelRecord {
  if (sortedHistory.length === 0) {
    throw new Error("No fuel records found in dataset");
  }
  return sortedHistory[sortedHistory.length - 1];
}

export function getPreviousWeekRecord(): WeeklyFuelRecord {
  if (sortedHistory.length < 2) {
    return getCurrentWeekRecord();
  }
  return sortedHistory[sortedHistory.length - 2];
}

export function getRecordByWeekId(weekId: string): WeeklyFuelRecord | undefined {
  return sortedHistory.find((r) => r.weekId === weekId);
}

function calculateFuelItem(
  fuelId: FuelId,
  currentPrices: Record<FuelId, number>,
  previousPrices: Record<FuelId, number>
): FuelPriceItem {
  const meta = FUELS_META[fuelId];
  const price = currentPrices[fuelId] ?? 0;
  const prevPrice = previousPrices[fuelId] ?? price;
  const change = Math.round((price - prevPrice) * 100) / 100;
  const percentageChange =
    prevPrice > 0 ? Math.round(((price - prevPrice) / prevPrice) * 10000) / 100 : 0;

  let trend: "up" | "down" | "unchanged" = "unchanged";
  if (change > 0) trend = "up";
  else if (change < 0) trend = "down";

  return {
    id: fuelId,
    name: meta?.name ?? fuelId,
    price,
    previousPrice: prevPrice,
    change,
    percentageChange,
    trend,
    unit: meta?.unit ?? "galón",
    subsidized: true,
  };
}

export function getWeeklySummary(): WeeklySummary {
  const current = getCurrentWeekRecord();
  const previous = getPreviousWeekRecord();

  const allItems: FuelPriceItem[] = Object.keys(FUELS_META).map((id) =>
    calculateFuelItem(id as FuelId, current.prices, previous.prices)
  );

  const consumerItems = CONSUMER_FUELS.map((id) =>
    calculateFuelItem(id, current.prices, previous.prices)
  );

  const industrialItems = INDUSTRIAL_FUELS.map((id) =>
    calculateFuelItem(id, current.prices, previous.prices)
  );

  // Consider consumer fuels as primary verdict drivers
  const hasIncreased = consumerItems.some((item) => item.change > 0);
  const hasDecreased = consumerItems.some((item) => item.change < 0);
  const isUnchanged = !hasIncreased && !hasDecreased;

  let headlineVerdict: "NO, SE MANTUVO" | "¡BAJÓ!" | "SÍ, SUBIÓ" = "NO, SE MANTUVO";
  let subVerdict = "Los precios de las gasolinas, gasoil y GLP no registran variación respecto a la semana pasada.";
  let badgeTone: "neutral" | "success" | "danger" | "warning" = "neutral";

  if (hasIncreased) {
    headlineVerdict = "SÍ, SUBIÓ";
    const increasedFuel = consumerItems.find((i) => i.change > 0);
    subVerdict = `Se registraron aumentos esta semana, encabezados por ${increasedFuel?.name ?? "combustibles"}.`;
    badgeTone = "danger";
  } else if (hasDecreased) {
    headlineVerdict = "¡BAJÓ!";
    const decreasedFuel = consumerItems.find((i) => i.change < 0);
    subVerdict = `¡Buenas noticias! Los precios bajaron para ${decreasedFuel?.name ?? "combustibles"}.`;
    badgeTone = "success";
  } else {
    headlineVerdict = "NO, SE MANTUVO";
    if (current.subsidyMillionDop) {
      subVerdict = `El gobierno destinó un subsidio de RD$ ${current.subsidyMillionDop.toLocaleString("es-DO")} millones para congelar las alzas internacionales.`;
    } else {
      subVerdict = "El Ministerio de Industria y Comercio mantuvo sin cambios los precios vigentes para la semana.";
    }
    badgeTone = "neutral";
  }

  const nextUpdate = getNextAnnouncementDate(new Date(current.endDate));

  return {
    currentWeek: current,
    previousWeek: previous,
    hasIncreased,
    hasDecreased,
    isUnchanged,
    headlineVerdict,
    subVerdict,
    badgeTone,
    items: allItems,
    consumerItems,
    industrialItems,
    totalSubsidyDopFormatted: current.subsidyMillionDop
      ? formatMillions(current.subsidyMillionDop)
      : undefined,
    nextUpdateDate: nextUpdate.toISOString(),
  };
}

export interface ChartPoint {
  date: string;
  shortLabel: string;
  price: number;
  change: number;
  dateLabel: string;
}

export function getFuelTimeSeries(fuelId: FuelId, weeksLimit: number = 26): ChartPoint[] {
  const slice = sortedHistory.slice(-weeksLimit);
  return slice.map((record, index) => {
    const price = record.prices[fuelId] ?? 0;
    const prevRecord = index > 0 ? slice[index - 1] : record;
    const prevPrice = prevRecord.prices[fuelId] ?? price;
    const change = Math.round((price - prevPrice) * 100) / 100;

    return {
      date: record.startDate,
      shortLabel: record.shortDateLabel,
      price,
      change,
      dateLabel: record.dateLabel,
    };
  });
}

export function calculateTankCost(fuelId: FuelId, gallons: number): TankCalculationResult {
  const current = getCurrentWeekRecord();
  const previous = getPreviousWeekRecord();

  const currentPrice = current.prices[fuelId] ?? 0;
  const previousPrice = previous.prices[fuelId] ?? currentPrice;

  const currentCost = Math.round(currentPrice * gallons * 100) / 100;
  const previousCost = Math.round(previousPrice * gallons * 100) / 100;
  const differenceCost = Math.round((currentCost - previousCost) * 100) / 100;

  return {
    fuelId,
    gallons,
    currentCost,
    previousCost,
    differenceCost,
  };
}
