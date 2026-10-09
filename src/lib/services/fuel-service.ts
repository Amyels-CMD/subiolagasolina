import rawHistory from "@/data/fuel-history.json";
import { CONSUMER_FUELS, FUELS_META, INDUSTRIAL_FUELS } from "@/lib/constants/fuels";
import {
  AggregateMovement,
  CategorizedChanges,
  FuelId,
  FuelPriceItem,
  HeadlineVerdict,
  ScopesSummary,
  StructuredVerdicts,
  TankCalculationResult,
  WeeklyFuelRecord,
  WeeklySummary,
} from "@/lib/types/fuel";

import { formatDominicanDateTime, getNextAnnouncementDate } from "@/lib/utils/date-rd";

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

export function getCurrentWeekRecord(history: WeeklyFuelRecord[] = sortedHistory): WeeklyFuelRecord {
  if (history.length === 0) {
    throw new Error("No fuel records found in dataset");
  }
  return history[history.length - 1];
}

export function getPreviousWeekRecord(history: WeeklyFuelRecord[] = sortedHistory): WeeklyFuelRecord {
  if (history.length < 2) {
    return getCurrentWeekRecord(history);
  }
  return history[history.length - 2];
}


export function getRecordByWeekId(weekId: string): WeeklyFuelRecord | undefined {
  return sortedHistory.find((r) => r.weekId === weekId);
}

export function calculateFuelItem(
  fuelId: FuelId,
  currentPrices: Record<FuelId, number>,
  previousPrices: Record<FuelId, number>
): FuelPriceItem {
  const meta = FUELS_META[fuelId];
  const priceRaw = currentPrices?.[fuelId];
  const prevPriceRaw = previousPrices?.[fuelId];

  // Defensive validation: ensure numeric, non-negative values
  const price =
    typeof priceRaw === "number" && !Number.isNaN(priceRaw) && priceRaw >= 0 ? priceRaw : 0;
  const prevPrice =
    typeof prevPriceRaw === "number" && !Number.isNaN(prevPriceRaw) && prevPriceRaw >= 0
      ? prevPriceRaw
      : price;

  // Strict rounding to 2 decimal places to eliminate floating point imprecision
  const deltaRaw = Math.round((price - prevPrice) * 100) / 100;
  const change = Math.abs(deltaRaw) < 0.0001 ? 0 : deltaRaw;

  let percentageChange = 0;
  if (prevPrice > 0 && change !== 0) {
    percentageChange = Math.round(((price - prevPrice) / prevPrice) * 10000) / 100;
  }

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
  };
}

export function computeAggregateMovement(items: FuelPriceItem[]): AggregateMovement {
  if (!items || items.length === 0) return "unchanged";
  const hasUp = items.some((i) => i.change > 0);
  const hasDown = items.some((i) => i.change < 0);

  if (hasUp && hasDown) return "mixed";
  if (hasUp) return "increased";
  if (hasDown) return "decreased";
  return "unchanged";
}

export function getWeeklySummary(historyOverride?: WeeklyFuelRecord[]): WeeklySummary {
  const history = historyOverride ?? sortedHistory;
  const current = getCurrentWeekRecord(history);
  const previous = getPreviousWeekRecord(history);

  const allItems: FuelPriceItem[] = Object.keys(FUELS_META).map((id) =>
    calculateFuelItem(id as FuelId, current.prices, previous.prices)
  );

  const consumerItems = CONSUMER_FUELS.map((id) =>
    calculateFuelItem(id, current.prices, previous.prices)
  );

  const industrialItems = INDUSTRIAL_FUELS.map((id) =>
    calculateFuelItem(id, current.prices, previous.prices)
  );

  // 1. ÁMBITO GASOLINAS (Estrictamente Premium y Regular)
  const premiumItem = allItems.find((i) => i.id === "gasolina-premium")!;
  const regularItem = allItems.find((i) => i.id === "gasolina-regular")!;
  const gasolineItems = [premiumItem, regularItem].filter(Boolean);
  const gasolineState = computeAggregateMovement(gasolineItems);

  // 2. ÁMBITO CONSUMO MASIVO (Gasolinas + Gasoils + GLP + Gas Natural)
  const consumerState = computeAggregateMovement(consumerItems);

  // 3. ÁMBITO MERCADO GLOBAL (Todos los 10 combustibles publicados)
  const marketState = computeAggregateMovement(allItems);

  // Categorización de cambios
  const changes: CategorizedChanges = {
    up: allItems.filter((i) => i.change > 0),
    down: allItems.filter((i) => i.change < 0),
    unchanged: allItems.filter((i) => i.change === 0),
  };

  // Reglas deterministas para el veredicto del titular principal
  let answer: "SÍ" | "NO" = "NO";
  let primaryWord: "NO." | "SÍ." | "BAJÓ." = "NO.";
  let secondaryPhrase = "SE MANTUVO";
  let headlineVerdict: HeadlineVerdict = "NO, SE MANTUVO";
  let subtext = "Los precios de la Gasolina Premium y Regular se mantienen sin cambios respecto a la semana anterior.";
  let tone: "neutral" | "success" | "danger" | "warning" = "neutral";

  if (gasolineState === "increased") {
    answer = "SÍ";
    primaryWord = "SÍ.";
    headlineVerdict = "SÍ, SUBIÓ";
    tone = "danger";

    if (premiumItem.change > 0 && regularItem.change > 0) {
      secondaryPhrase = "SUBIÓ ESTA SEMANA";
      subtext = `Subieron los precios de ambas gasolinas: Premium (+RD$ ${premiumItem.change.toFixed(2)}) y Regular (+RD$ ${regularItem.change.toFixed(2)}).`;
    } else if (premiumItem.change > 0) {
      secondaryPhrase = "SUBIÓ LA PREMIUM";
      subtext = `Subió la Gasolina Premium (+RD$ ${premiumItem.change.toFixed(2)}), mientras la Regular se mantuvo sin cambios.`;
    } else {
      secondaryPhrase = "SUBIÓ LA REGULAR";
      subtext = `Subió la Gasolina Regular (+RD$ ${regularItem.change.toFixed(2)}), mientras la Premium se mantuvo sin cambios.`;
    }
  } else if (gasolineState === "mixed") {
    answer = "SÍ";
    primaryWord = "SÍ.";
    secondaryPhrase = "MOVIMIENTOS MIXTOS";
    headlineVerdict = "SÍ, SUBIÓ";
    tone = "warning";
    const subio = premiumItem.change > 0 ? "Premium (+)" : "Regular (+)";
    const bajo = premiumItem.change < 0 ? "Premium (-)" : "Regular (-)";
    subtext = `Movimientos mixtos en gasolinas: ${subio} subió mientras ${bajo} bajó de precio.`;
  } else if (gasolineState === "decreased") {
    answer = "NO";
    primaryWord = "BAJÓ.";
    headlineVerdict = "¡BAJÓ!";
    tone = "success";

    if (premiumItem.change < 0 && regularItem.change < 0) {
      secondaryPhrase = "BAJÓ EN LA BOMBA";
      subtext = `¡Buenas noticias! Bajaron ambas gasolinas: Premium (-RD$ ${Math.abs(premiumItem.change).toFixed(2)}) y Regular (-RD$ ${Math.abs(regularItem.change).toFixed(2)}).`;
    } else if (premiumItem.change < 0) {
      secondaryPhrase = "BAJÓ LA PREMIUM";
      subtext = `Rebaja en Gasolina Premium (-RD$ ${Math.abs(premiumItem.change).toFixed(2)}), mientras la Regular se mantuvo sin cambios.`;
    } else {
      secondaryPhrase = "BAJÓ LA REGULAR";
      subtext = `Rebaja en Gasolina Regular (-RD$ ${Math.abs(regularItem.change).toFixed(2)}), mientras la Regular se mantuvo sin cambios.`;
    }
  } else {
    answer = "NO";
    primaryWord = "NO.";
    secondaryPhrase = "SE MANTUVO";
    headlineVerdict = "NO, SE MANTUVO";
    tone = "neutral";
    subtext = "Los precios de la Gasolina Premium y Regular se mantienen sin cambios respecto a la semana anterior.";
  }

  // Análisis de otros combustibles para contextualización sin ocultar cambios en ningún derivado
  const otherConsumerItems = consumerItems.filter(
    (i) => i.id !== "gasolina-premium" && i.id !== "gasolina-regular"
  );
  const otherConsumerUps = otherConsumerItems.filter((i) => i.change > 0);
  const otherConsumerDowns = otherConsumerItems.filter((i) => i.change < 0);
  const hasOtherConsumerChanges = otherConsumerUps.length > 0 || otherConsumerDowns.length > 0;

  const industrialUps = industrialItems.filter((i) => i.change > 0);
  const industrialDowns = industrialItems.filter((i) => i.change < 0);
  const hasIndustrialChanges = industrialUps.length > 0 || industrialDowns.length > 0;

  // hasNotableOtherChanges es TRUE si CUALQUIER combustible no-gasolina registró variación oficial
  const hasNotableOtherChanges = hasOtherConsumerChanges || hasIndustrialChanges;

  let notableChangeSummary: string | undefined;
  if (hasOtherConsumerChanges && hasIndustrialChanges) {
    const cSummary =
      otherConsumerUps.length > 0 && otherConsumerDowns.length > 0
        ? `variaciones mixtas en otros combustibles de consumo (${otherConsumerUps.map((i) => i.name).join(", ")}; rebajas en ${otherConsumerDowns.map((i) => i.name).join(", ")})`
        : otherConsumerUps.length > 0
        ? `alzas en otros combustibles de consumo (${otherConsumerUps.map((i) => `${i.name} +RD$ ${i.change.toFixed(2)}`).join(", ")})`
        : `rebajas en otros combustibles (${otherConsumerDowns.map((i) => `${i.name} -RD$ ${Math.abs(i.change).toFixed(2)}`).join(", ")})`;
    notableChangeSummary = `Aviso: Se registraron ${cSummary}, además de ajustes en derivados industriales.`;
  } else if (hasOtherConsumerChanges) {
    if (otherConsumerUps.length > 0 && otherConsumerDowns.length > 0) {
      notableChangeSummary = `Otros combustibles registraron variaciones mixtas (alzas en ${otherConsumerUps.map((i) => i.name).join(", ")}; rebajas en ${otherConsumerDowns.map((i) => i.name).join(", ")}).`;
    } else if (otherConsumerUps.length > 0) {
      notableChangeSummary = `Aviso: Se registraron alzas en otros combustibles de consumo (${otherConsumerUps.map((i) => `${i.name} +RD$ ${i.change.toFixed(2)}`).join(", ")}).`;
    } else {
      notableChangeSummary = `Aviso: Se registraron rebajas en otros combustibles (${otherConsumerDowns.map((i) => `${i.name} -RD$ ${Math.abs(i.change).toFixed(2)}`).join(", ")}).`;
    }
  } else if (hasIndustrialChanges) {
    const indParts: string[] = [];
    if (industrialUps.length > 0) {
      indParts.push(`alzas en ${industrialUps.map((i) => `${i.name} +RD$ ${i.change.toFixed(2)}`).join(", ")}`);
    }
    if (industrialDowns.length > 0) {
      indParts.push(`rebajas en ${industrialDowns.map((i) => `${i.name} -RD$ ${Math.abs(i.change).toFixed(2)}`).join(", ")}`);
    }
    notableChangeSummary = `Combustibles de consumo masivo sin variación; se registraron ajustes en derivados industriales y de aviación (${indParts.join("; ")}).`;
  }

  let consumerSummaryText = "";
  if (consumerState === "unchanged") {
    consumerSummaryText = "Todos los combustibles de consumo masivo (gasolinas, gasoil, GLP y gas natural) se mantienen sin cambios.";
  } else if (consumerState === "increased") {
    consumerSummaryText = "Se registraron aumentos en combustibles de consumo masivo sin rebajas en esta categoría.";
  } else if (consumerState === "decreased") {
    consumerSummaryText = "Se registraron rebajas en combustibles de consumo masivo.";
  } else {
    consumerSummaryText = "Movimientos mixtos en la categoría de consumo masivo.";
  }

  let marketSummaryText = "";
  if (marketState === "unchanged") {
    marketSummaryText = "Ningún combustible oficial presentó variación en el mercado nacional.";
  } else if (marketState === "increased") {
    marketSummaryText = "Aumentos generalizados en el mercado de combustibles.";
  } else if (marketState === "decreased") {
    marketSummaryText = "Rebajas en el mercado oficial de combustibles.";
  } else {
    marketSummaryText = "Movimientos mixtos en el mercado oficial de combustibles (incluyendo derivados industriales).";
  }

  // Booleans con alcance explícito por categoría para evitar contradicciones
  const gasolineHasIncreased = gasolineState === "increased" || gasolineState === "mixed";
  const gasolineHasDecreased = gasolineState === "decreased" || gasolineState === "mixed";
  const gasolineIsUnchanged = gasolineState === "unchanged";

  const consumerHasIncreased = consumerState === "increased" || consumerState === "mixed";
  const consumerHasDecreased = consumerState === "decreased" || consumerState === "mixed";
  const consumerIsUnchanged = consumerState === "unchanged";

  const marketHasIncreased = marketState === "increased" || marketState === "mixed";
  const marketHasDecreased = marketState === "decreased" || marketState === "mixed";
  const marketIsUnchanged = marketState === "unchanged";

  const scopes: ScopesSummary = {
    gasoline: {
      state: gasolineState,
      hasIncreased: gasolineHasIncreased,
      hasDecreased: gasolineHasDecreased,
      isUnchanged: gasolineIsUnchanged,
      headline: headlineVerdict,
      answer,
    },
    consumer: {
      state: consumerState,
      hasIncreased: consumerHasIncreased,
      hasDecreased: consumerHasDecreased,
      isUnchanged: consumerIsUnchanged,
      summaryText: consumerSummaryText,
    },
    market: {
      state: marketState,
      hasIncreased: marketHasIncreased,
      hasDecreased: marketHasDecreased,
      isUnchanged: marketIsUnchanged,
      summaryText: marketSummaryText,
    },
  };

  const verdicts: StructuredVerdicts = {
    gasoline: {
      answer,
      primaryWord,
      secondaryPhrase,
      headline: headlineVerdict,
      subtext,
      tone,
      hasIncreased: gasolineHasIncreased,
      hasDecreased: gasolineHasDecreased,
      isUnchanged: gasolineIsUnchanged,
    },
    consumer: {
      state: consumerState,
      summaryText: consumerSummaryText,
      hasNotableOtherChanges,
      notableChangeSummary,
      hasIncreased: consumerHasIncreased,
      hasDecreased: consumerHasDecreased,
      isUnchanged: consumerIsUnchanged,
    },
    market: {
      state: marketState,
      summaryText: marketSummaryText,
      hasNotableOtherChanges: hasIndustrialChanges,
      hasIncreased: marketHasIncreased,
      hasDecreased: marketHasDecreased,
      isUnchanged: marketIsUnchanged,
    },
  };

  const nextUpdate = getNextAnnouncementDate(current.endDate);

  // Benchmark WTI (Texas) de referencia internacional citado por el MICM
  const wti = {
    priceUsd: 89.04,
    changeUsd: -1.25,
    percentageChange: -1.38,
    trend: "down" as const,
    label: "Crudo WTI • Texas (Ref. Internacional)",
  };

  return {
    gasolineState,
    consumerState,
    marketState,
    scopes,
    verdicts,
    changes,
    hasNotableOtherChanges,
    hasOtherConsumerChanges,
    hasIndustrialChanges,
    notableChangeSummary,
    currentWeek: current,
    previousWeek: previous,
    hasIncreased: gasolineHasIncreased,
    hasDecreased: gasolineHasDecreased,
    isUnchanged: gasolineIsUnchanged,
    headlineVerdict,
    subVerdict: subtext,
    badgeTone: tone,
    items: allItems,
    consumerItems,
    industrialItems,
    nextUpdateDate: nextUpdate.toISOString(),
    nextUpdateDateDominican: formatDominicanDateTime(nextUpdate),
    wti,
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
