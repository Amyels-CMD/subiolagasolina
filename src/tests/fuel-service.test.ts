import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getAllHistory,
  getCurrentWeekRecord,
  getWeeklySummary,
  calculateTankCost,
  getFuelTimeSeries,
} from "../lib/services/fuel-service.js";
import { formatCurrency, formatDelta, formatPercentage } from "../lib/utils/format.js";
import {
  formatDominicanDateTime,
  getDominicanNow,
  getNextAnnouncementDate,
  getTimeUntilAnnouncement,
} from "../lib/utils/date-rd.js";

describe("Fuel Service Tests", () => {
  it("should load historical records from real dataset", () => {
    const history = getAllHistory();
    assert.ok(Array.isArray(history));
    assert.ok(history.length > 50, "Should have more than 50 historical records");
  });

  it("should have correct current week record", () => {
    const current = getCurrentWeekRecord();
    assert.ok(current.weekId);
    assert.strictEqual(current.prices["gasolina-premium"], 358.1);
    assert.strictEqual(current.prices["gasolina-regular"], 317.5);
    assert.strictEqual(current.prices["gasoil-optimo"], 318.1);
    assert.strictEqual(current.prices["gasoil-regular"], 270.8);
    assert.strictEqual(current.prices["glp"], 135.2);
    assert.strictEqual(current.prices["gas-natural"], 43.97);
  });

  it("should compute weekly summary and verdict correctly with real data", () => {
    const summary = getWeeklySummary();
    assert.strictEqual(summary.headlineVerdict, "SÍ, SUBIÓ");
    assert.strictEqual(summary.gasolineState, "increased");
    assert.strictEqual(summary.consumerState, "increased");
    assert.strictEqual(summary.isUnchanged, false);
    assert.strictEqual(summary.hasIncreased, true);
    assert.strictEqual(summary.hasDecreased, false);
    assert.strictEqual(summary.verdicts.gasoline.answer, "SÍ");
    assert.ok(summary.consumerItems.length === 6);
    assert.ok(summary.industrialItems.length === 4);

    const premiumItem = summary.consumerItems.find((i) => i.id === "gasolina-premium");
    assert.ok(premiumItem);
    assert.strictEqual(premiumItem.price, 358.1);
    assert.strictEqual(premiumItem.change, 5);
    assert.strictEqual(premiumItem.trend, "up");
  });

  it("should accurately calculate vehicle tank costs", () => {
    const calc = calculateTankCost("gasolina-premium", 10);
    assert.strictEqual(calc.currentCost, 3581.0);
    assert.strictEqual(calc.differenceCost, 50.0);
  });

  it("should generate valid time series for charting", () => {
    const series = getFuelTimeSeries("gasolina-premium", 12);
    assert.strictEqual(series.length, 12);
    const last = series[series.length - 1];
    assert.strictEqual(last.price, 358.1);
  });
});

// Helper for generating controlled 2-week scenarios
function createControlledHistory(
  currPrices: Partial<Record<string, number>>,
  prevPrices: Partial<Record<string, number>>,
  options?: { prevYear?: number; currYear?: number; prevWeek?: string; currWeek?: string }
) {
  const basePrices: Record<string, number> = {
    "gasolina-premium": 353.10,
    "gasolina-regular": 317.50,
    "gasoil-optimo": 306.10,
    "gasoil-regular": 270.80,
    "glp": 135.20,
    "gas-natural": 43.97,
    "avtur": 336.99,
    "kerosene": 383.70,
    "fuel-oil-6": 176.72,
    "fuel-oil-1s": 210.39,
  };

  const prevRecord = {
    weekId: options?.prevWeek ?? "2026-W39",
    year: options?.prevYear ?? 2026,
    weekNumber: 39,
    startDate: options?.prevYear ? `${options.prevYear}-12-25` : "2026-09-26",
    endDate: options?.prevYear ? `${options.prevYear}-12-31` : "2026-10-02",
    dateLabel: "26 de septiembre al 2 de octubre de 2026",
    shortDateLabel: "26 Sep - 2 Oct",
    announcementDate: options?.prevYear ? `${options.prevYear}-12-24` : "2026-09-25",
    source: "MICM",
    prices: { ...basePrices, ...prevPrices },
  };

  const currRecord = {
    weekId: options?.currWeek ?? "2026-W40",
    year: options?.currYear ?? 2026,
    weekNumber: 40,
    startDate: options?.currYear && options?.prevYear ? `${options.currYear}-01-01` : "2026-10-03",
    endDate: options?.currYear && options?.prevYear ? `${options.currYear}-01-07` : "2026-10-09",
    dateLabel: "3 al 9 de octubre de 2026",
    shortDateLabel: "3-9 Oct",
    announcementDate: options?.currYear && options?.prevYear ? `${options.currYear}-01-01` : "2026-10-02",
    source: "MICM",
    prices: { ...basePrices, ...currPrices },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return [prevRecord, currRecord] as any;
}


describe("18 Mandatory Scenarios for Verdicts and Integrity", () => {
  it("Scenario 1: Ambos tipos de gasolina permanecen iguales", () => {
    const history = createControlledHistory(
      { "gasolina-premium": 350, "gasolina-regular": 310 },
      { "gasolina-premium": 350, "gasolina-regular": 310 }
    );
    const summary = getWeeklySummary(history);
    assert.strictEqual(summary.gasolineState, "unchanged");
    assert.strictEqual(summary.headlineVerdict, "NO, SE MANTUVO");
    assert.strictEqual(summary.verdicts.gasoline.answer, "NO");
    assert.strictEqual(summary.verdicts.gasoline.primaryWord, "NO.");
    assert.strictEqual(summary.hasIncreased, false);
    assert.strictEqual(summary.hasDecreased, false);
    assert.strictEqual(summary.isUnchanged, true);
    assert.strictEqual(summary.scopes.gasoline.isUnchanged, true);
    assert.strictEqual(summary.hasNotableOtherChanges, false);
    assert.strictEqual(summary.subVerdict.includes("sin cambios"), true);
    assert.strictEqual(summary.subVerdict.includes("congelados"), false);
  });

  it("Scenario 2: Ambos tipos de gasolina suben", () => {
    const history = createControlledHistory(
      { "gasolina-premium": 355, "gasolina-regular": 315 },
      { "gasolina-premium": 350, "gasolina-regular": 310 }
    );
    const summary = getWeeklySummary(history);
    assert.strictEqual(summary.gasolineState, "increased");
    assert.strictEqual(summary.headlineVerdict, "SÍ, SUBIÓ");
    assert.strictEqual(summary.verdicts.gasoline.answer, "SÍ");
    assert.strictEqual(summary.verdicts.gasoline.primaryWord, "SÍ.");
    assert.strictEqual(summary.verdicts.gasoline.secondaryPhrase, "SUBIÓ ESTA SEMANA");
    assert.strictEqual(summary.hasIncreased, true);
  });

  it("Scenario 3: Ambos tipos de gasolina bajan", () => {
    const history = createControlledHistory(
      { "gasolina-premium": 345, "gasolina-regular": 305 },
      { "gasolina-premium": 350, "gasolina-regular": 310 }
    );
    const summary = getWeeklySummary(history);
    assert.strictEqual(summary.gasolineState, "decreased");
    assert.strictEqual(summary.headlineVerdict, "¡BAJÓ!");
    assert.strictEqual(summary.verdicts.gasoline.answer, "NO");
    assert.strictEqual(summary.verdicts.gasoline.primaryWord, "BAJÓ.");
    assert.strictEqual(summary.verdicts.gasoline.secondaryPhrase, "BAJÓ EN LA BOMBA");
    assert.strictEqual(summary.hasDecreased, true);
  });


  it("Scenario 4: La Premium sube y la Regular permanece igual", () => {
    const history = createControlledHistory(
      { "gasolina-premium": 355, "gasolina-regular": 310 },
      { "gasolina-premium": 350, "gasolina-regular": 310 }
    );
    const summary = getWeeklySummary(history);
    assert.strictEqual(summary.gasolineState, "increased");
    assert.strictEqual(summary.headlineVerdict, "SÍ, SUBIÓ");
    assert.strictEqual(summary.verdicts.gasoline.answer, "SÍ");
    assert.strictEqual(summary.verdicts.gasoline.secondaryPhrase, "SUBIÓ LA PREMIUM");
  });

  it("Scenario 5: La Premium sube y la Regular baja", () => {
    const history = createControlledHistory(
      { "gasolina-premium": 355, "gasolina-regular": 305 },
      { "gasolina-premium": 350, "gasolina-regular": 310 }
    );
    const summary = getWeeklySummary(history);
    assert.strictEqual(summary.gasolineState, "mixed");
    assert.strictEqual(summary.headlineVerdict, "SÍ, SUBIÓ");
    assert.strictEqual(summary.verdicts.gasoline.answer, "SÍ");
    assert.strictEqual(summary.verdicts.gasoline.secondaryPhrase, "MOVIMIENTOS MIXTOS");
    assert.strictEqual(summary.hasIncreased, true);
    assert.strictEqual(summary.hasDecreased, true);
    assert.strictEqual(summary.isUnchanged, false);
    assert.strictEqual(summary.scopes.gasoline.hasIncreased, true);
    assert.strictEqual(summary.scopes.gasoline.hasDecreased, true);
    assert.strictEqual(summary.scopes.gasoline.isUnchanged, false);
  });

  it("Scenario 6: La Premium baja y la Regular sube", () => {
    const history = createControlledHistory(
      { "gasolina-premium": 345, "gasolina-regular": 315 },
      { "gasolina-premium": 350, "gasolina-regular": 310 }
    );
    const summary = getWeeklySummary(history);
    assert.strictEqual(summary.gasolineState, "mixed");
    assert.strictEqual(summary.headlineVerdict, "SÍ, SUBIÓ");
    assert.strictEqual(summary.verdicts.gasoline.answer, "SÍ");
    assert.strictEqual(summary.verdicts.gasoline.secondaryPhrase, "MOVIMIENTOS MIXTOS");
  });

  it("Scenario 7: La gasolina permanece igual mientras sube el gasoil", () => {
    const history = createControlledHistory(
      { "gasolina-premium": 350, "gasolina-regular": 310, "gasoil-regular": 275 },
      { "gasolina-premium": 350, "gasolina-regular": 310, "gasoil-regular": 270 }
    );
    const summary = getWeeklySummary(history);
    // Crucial check: Headline must NOT say yes to "¿Subió la gasolina?"
    assert.strictEqual(summary.gasolineState, "unchanged");
    assert.strictEqual(summary.headlineVerdict, "NO, SE MANTUVO");
    assert.strictEqual(summary.verdicts.gasoline.answer, "NO");
    assert.strictEqual(summary.isUnchanged, true);
    assert.strictEqual(summary.scopes.gasoline.isUnchanged, true);
    assert.strictEqual(summary.consumerState, "increased");
    assert.strictEqual(summary.scopes.consumer.isUnchanged, false);
    assert.strictEqual(summary.scopes.consumer.hasIncreased, true);
    assert.strictEqual(summary.hasNotableOtherChanges, true);
    assert.strictEqual(summary.verdicts.consumer.hasNotableOtherChanges, true);
    assert.ok(summary.verdicts.consumer.notableChangeSummary?.includes("Gasoil Regular"));
  });

  it("Scenario 8: La gasolina baja mientras sube el gasoil", () => {
    const history = createControlledHistory(
      { "gasolina-premium": 345, "gasolina-regular": 305, "gasoil-regular": 275 },
      { "gasolina-premium": 350, "gasolina-regular": 310, "gasoil-regular": 270 }
    );
    const summary = getWeeklySummary(history);
    assert.strictEqual(summary.gasolineState, "decreased");
    assert.strictEqual(summary.headlineVerdict, "¡BAJÓ!");
    assert.strictEqual(summary.consumerState, "mixed");
  });

  it("Scenario 9: Consumo masivo permanece igual, aunque cambien industriales (Caso de prueba oficial)", () => {
    const history = createControlledHistory(
      {
        "gasolina-premium": 353.10,
        "gasolina-regular": 317.50,
        "gasoil-optimo": 306.10,
        "gasoil-regular": 270.80,
        "glp": 135.20,
        "gas-natural": 43.97,
        "avtur": 333.65,      // bajó
        "kerosene": 380.10,   // bajó
        "fuel-oil-6": 180.76, // subió
        "fuel-oil-1s": 212.75 // subió
      },
      {
        "gasolina-premium": 353.10,
        "gasolina-regular": 317.50,
        "gasoil-optimo": 306.10,
        "gasoil-regular": 270.80,
        "glp": 135.20,
        "gas-natural": 43.97,
        "avtur": 336.99,
        "kerosene": 383.70,
        "fuel-oil-6": 176.72,
        "fuel-oil-1s": 210.39
      }
    );
    const summary = getWeeklySummary(history);
    assert.strictEqual(summary.gasolineState, "unchanged");
    assert.strictEqual(summary.consumerState, "unchanged");
    assert.strictEqual(summary.marketState, "mixed");
    assert.strictEqual(summary.headlineVerdict, "NO, SE MANTUVO");
    assert.strictEqual(summary.changes.up.length, 2);
    assert.strictEqual(summary.changes.down.length, 2);
    assert.strictEqual(summary.changes.unchanged.length, 6);
    // Verificar que hasNotableOtherChanges NUNCA oculta cambios en derivados industriales
    assert.strictEqual(summary.hasNotableOtherChanges, true);
    assert.strictEqual(summary.hasOtherConsumerChanges, false);
    assert.strictEqual(summary.hasIndustrialChanges, true);
    assert.strictEqual(summary.verdicts.consumer.hasNotableOtherChanges, true);
    assert.ok(summary.notableChangeSummary?.includes("Avtur"));
    assert.ok(summary.notableChangeSummary?.includes("Fuel Oíl"));
    assert.strictEqual(summary.verdicts.consumer.summaryText.includes("congelados"), false);
    assert.ok(summary.verdicts.consumer.summaryText.includes("sin cambios"));
  });

  it("Scenario 10: Consumo masivo presenta exclusivamente subidas", () => {
    const history = createControlledHistory(
      {
        "gasolina-premium": 355,
        "gasolina-regular": 320,
        "gasoil-optimo": 310,
        "gasoil-regular": 275,
        "glp": 140,
        "gas-natural": 45
      },
      {
        "gasolina-premium": 350,
        "gasolina-regular": 315,
        "gasoil-optimo": 305,
        "gasoil-regular": 270,
        "glp": 135,
        "gas-natural": 43
      }
    );
    const summary = getWeeklySummary(history);
    assert.strictEqual(summary.consumerState, "increased");
  });

  it("Scenario 11: Consumo masivo presenta exclusivamente bajadas", () => {
    const history = createControlledHistory(
      {
        "gasolina-premium": 345,
        "gasolina-regular": 310,
        "gasoil-optimo": 300,
        "gasoil-regular": 265,
        "glp": 130,
        "gas-natural": 40
      },
      {
        "gasolina-premium": 350,
        "gasolina-regular": 315,
        "gasoil-optimo": 305,
        "gasoil-regular": 270,
        "glp": 135,
        "gas-natural": 43
      }
    );
    const summary = getWeeklySummary(history);
    assert.strictEqual(summary.consumerState, "decreased");
  });

  it("Scenario 12: Consumo masivo presenta movimientos mixtos", () => {
    const history = createControlledHistory(
      {
        "gasolina-premium": 355, // subió
        "glp": 130               // bajó
      },
      {
        "gasolina-premium": 350,
        "glp": 135
      }
    );
    const summary = getWeeklySummary(history);
    assert.strictEqual(summary.consumerState, "mixed");
  });

  it("Scenario 13: Todos los combustibles permanecen iguales (Mercado sin cambios)", () => {
    const history = createControlledHistory({}, {});
    const summary = getWeeklySummary(history);
    assert.strictEqual(summary.gasolineState, "unchanged");
    assert.strictEqual(summary.consumerState, "unchanged");
    assert.strictEqual(summary.marketState, "unchanged");
    assert.strictEqual(summary.scopes.gasoline.isUnchanged, true);
    assert.strictEqual(summary.scopes.consumer.isUnchanged, true);
    assert.strictEqual(summary.scopes.market.isUnchanged, true);
    assert.strictEqual(summary.hasNotableOtherChanges, false);
    assert.strictEqual(summary.hasOtherConsumerChanges, false);
    assert.strictEqual(summary.hasIndustrialChanges, false);
    assert.strictEqual(summary.changes.up.length, 0);
    assert.strictEqual(summary.changes.down.length, 0);
    assert.strictEqual(summary.changes.unchanged.length, 10);
  });

  it("Scenario 14a: Todos los combustibles presentan aumento (Mercado con aumentos)", () => {
    const history = createControlledHistory(
      {
        "gasolina-premium": 360, "gasolina-regular": 325,
        "gasoil-optimo": 315, "gasoil-regular": 280,
        "glp": 140, "gas-natural": 46,
        "avtur": 345, "kerosene": 390,
        "fuel-oil-6": 185, "fuel-oil-1s": 220
      },
      {
        "gasolina-premium": 350, "gasolina-regular": 315,
        "gasoil-optimo": 305, "gasoil-regular": 270,
        "glp": 135, "gas-natural": 43,
        "avtur": 335, "kerosene": 380,
        "fuel-oil-6": 175, "fuel-oil-1s": 210
      }
    );
    const summary = getWeeklySummary(history);
    assert.strictEqual(summary.gasolineState, "increased");
    assert.strictEqual(summary.consumerState, "increased");
    assert.strictEqual(summary.marketState, "increased");
    assert.strictEqual(summary.scopes.gasoline.hasIncreased, true);
    assert.strictEqual(summary.scopes.consumer.hasIncreased, true);
    assert.strictEqual(summary.scopes.market.hasIncreased, true);
    assert.strictEqual(summary.hasNotableOtherChanges, true);
    assert.strictEqual(summary.hasOtherConsumerChanges, true);
    assert.strictEqual(summary.hasIndustrialChanges, true);
    assert.strictEqual(summary.changes.up.length, 10);
    assert.strictEqual(summary.changes.down.length, 0);
  });

  it("Scenario 14b: Todos los combustibles presentan rebaja (Mercado con reducciones)", () => {
    const history = createControlledHistory(
      {
        "gasolina-premium": 340, "gasolina-regular": 305,
        "gasoil-optimo": 295, "gasoil-regular": 260,
        "glp": 130, "gas-natural": 41,
        "avtur": 325, "kerosene": 370,
        "fuel-oil-6": 165, "fuel-oil-1s": 200
      },
      {
        "gasolina-premium": 350, "gasolina-regular": 315,
        "gasoil-optimo": 305, "gasoil-regular": 270,
        "glp": 135, "gas-natural": 43,
        "avtur": 335, "kerosene": 380,
        "fuel-oil-6": 175, "fuel-oil-1s": 210
      }
    );
    const summary = getWeeklySummary(history);
    assert.strictEqual(summary.gasolineState, "decreased");
    assert.strictEqual(summary.consumerState, "decreased");
    assert.strictEqual(summary.marketState, "decreased");
    assert.strictEqual(summary.scopes.gasoline.hasDecreased, true);
    assert.strictEqual(summary.scopes.consumer.hasDecreased, true);
    assert.strictEqual(summary.scopes.market.hasDecreased, true);
    assert.strictEqual(summary.verdicts.gasoline.secondaryPhrase, "BAJÓ EN LA BOMBA");
    assert.strictEqual(summary.changes.down.length, 10);
  });

  it("Scenario 14c: Todos los combustibles presentan movimientos mixtos (Mercado con movimientos mixtos)", () => {
    const history = createControlledHistory(
      { "avtur": 340, "kerosene": 370 },
      { "avtur": 330, "kerosene": 380 }
    );
    const summary = getWeeklySummary(history);
    assert.strictEqual(summary.marketState, "mixed");
    assert.strictEqual(summary.scopes.market.hasIncreased, true);
    assert.strictEqual(summary.scopes.market.hasDecreased, true);
    assert.strictEqual(summary.scopes.market.isUnchanged, false);
  });

  it("Scenario 15: Faltan precios anteriores o existen valores inválidos", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const badPrices: any = { "gasolina-premium": null, "glp": -50, "avtur": NaN };
    const history = createControlledHistory(badPrices, {});
    const summary = getWeeklySummary(history);
    assert.ok(summary);
    const prem = summary.items.find((i) => i.id === "gasolina-premium")!;
    assert.strictEqual(typeof prem.price, "number");
    assert.strictEqual(Number.isNaN(prem.price), false);
  });


  it("Scenario 16: Previene divisiones por cero potenciales y errores flotantes", () => {
    const zeroHistory = createControlledHistory({ "gasolina-premium": 100 }, { "gasolina-premium": 0 });

    const summary = getWeeklySummary(zeroHistory);
    const prem = summary.items.find((i) => i.id === "gasolina-premium");
    assert.ok(prem);
    assert.strictEqual(Number.isFinite(prem.percentageChange), true);
    assert.strictEqual(Number.isNaN(prem.percentageChange), false);
  });

  it("Scenario 17: Comparación entre semanas con cambio de año", () => {
    const history = createControlledHistory(
      { "gasolina-premium": 360 },
      { "gasolina-premium": 350 },
      { prevYear: 2025, currYear: 2026, prevWeek: "2025-W52", currWeek: "2026-W01" }
    );
    const summary = getWeeklySummary(history);
    assert.strictEqual(summary.previousWeek.year, 2025);
    assert.strictEqual(summary.currentWeek.year, 2026);
    assert.strictEqual(summary.gasolineState, "increased");
  });

  it("Scenario 18: Campos redundantes coinciden estrictamente con fuentes canónicas", () => {
    const summary = getWeeklySummary();
    const premiumItem = summary.items.find((i) => i.id === "gasolina-premium")!;
    assert.strictEqual(summary.currentWeek.prices["gasolina-premium"], premiumItem.price);
    assert.strictEqual(summary.headlineVerdict, summary.verdicts.gasoline.headline);
    assert.strictEqual(summary.subVerdict, summary.verdicts.gasoline.subtext);
    assert.strictEqual(summary.isUnchanged, summary.gasolineState === "unchanged");
    assert.strictEqual(summary.scopes.gasoline.state, summary.gasolineState);
    assert.strictEqual(summary.scopes.consumer.state, summary.consumerState);
    assert.strictEqual(summary.scopes.market.state, summary.marketState);
    assert.strictEqual(summary.verdicts.gasoline.hasIncreased, summary.hasIncreased);
    assert.strictEqual(summary.verdicts.gasoline.hasDecreased, summary.hasDecreased);
    assert.strictEqual(summary.verdicts.gasoline.isUnchanged, summary.isUnchanged);
  });
});


describe("Format Utilities Tests", () => {
  it("should format Dominican currency correctly", () => {
    const formatted = formatCurrency(353.1);
    assert.ok(formatted.includes("RD$"));
    assert.ok(formatted.includes("353"));
  });

  it("should format deltas with signs", () => {
    assert.strictEqual(formatDelta(0), "RD$ 0.00");
    assert.ok(formatDelta(3.5).startsWith("+RD$"));
    assert.ok(formatDelta(-2.5).startsWith("-RD$") || formatDelta(-2.5).includes("2.50"));
  });

  it("should format percentage with signs", () => {
    assert.strictEqual(formatPercentage(0), "0.0%");
    assert.strictEqual(formatPercentage(1.234), "+1.23%");
    assert.strictEqual(formatPercentage(-1.234), "-1.23%");
  });
});

describe("Date Utilities Tests", () => {
  it("should calculate next Friday 1:00 PM announcement in exact UTC and Dominican AST time", () => {
    // Reference on Wednesday Oct 7, 2026 at 10:00 AM AST (14:00 UTC)
    const ref = new Date("2026-10-07T14:00:00Z");
    const nextFriday = getNextAnnouncementDate(ref);
    assert.ok(nextFriday instanceof Date);

    // Exact UTC check: 1:00 PM AST (UTC-4) = 17:00:00.000Z
    assert.strictEqual(nextFriday.toISOString(), "2026-10-09T17:00:00.000Z");

    // Exact Dominican AST check: Hour must be 13 (1:00 PM) on Friday (day 5)
    const dom = getDominicanNow(nextFriday);
    assert.strictEqual(dom.hours, 13);
    assert.strictEqual(dom.dayOfWeek, 5);
    assert.strictEqual(dom.isoDate, "2026-10-09");

    // Check countdown from reference
    const diff = getTimeUntilAnnouncement(nextFriday, ref);
    assert.ok(diff.days >= 1);
    assert.strictEqual(diff.isPastOrImminent, false);

    // Test passing an ISO date string directly
    const nextFromStr = getNextAnnouncementDate("2026-10-09");
    assert.strictEqual(nextFromStr.toISOString(), "2026-10-09T17:00:00.000Z");

    // Test Dominican locale string formatting
    const formatted = formatDominicanDateTime(nextFriday);
    assert.ok(formatted.toLowerCase().includes("1:00"));
    assert.ok(formatted.toLowerCase().includes("viernes"));
  });
});
