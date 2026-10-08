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
import { getNextAnnouncementDate, getTimeUntilAnnouncement } from "../lib/utils/date-rd.js";

describe("Fuel Service Tests", () => {
  it("should load historical records from real dataset", () => {
    const history = getAllHistory();
    assert.ok(Array.isArray(history));
    assert.ok(history.length > 50, "Should have more than 50 historical records");
  });

  it("should have correct current week record", () => {
    const current = getCurrentWeekRecord();
    assert.ok(current.weekId);
    assert.strictEqual(current.prices["gasolina-premium"], 353.1);
    assert.strictEqual(current.prices["gasolina-regular"], 317.5);
    assert.strictEqual(current.prices["gasoil-optimo"], 306.1);
    assert.strictEqual(current.prices["gasoil-regular"], 270.8);
    assert.strictEqual(current.prices["glp"], 135.2);
    assert.strictEqual(current.prices["gas-natural"], 43.97);
  });

  it("should compute weekly summary and verdict correctly", () => {
    const summary = getWeeklySummary();
    assert.strictEqual(summary.headlineVerdict, "NO, SE MANTUVO");
    assert.strictEqual(summary.isUnchanged, true);
    assert.strictEqual(summary.hasIncreased, false);
    assert.strictEqual(summary.hasDecreased, false);
    assert.ok(summary.consumerItems.length === 6);
    assert.ok(summary.industrialItems.length === 4);

    const premiumItem = summary.consumerItems.find((i) => i.id === "gasolina-premium");
    assert.ok(premiumItem);
    assert.strictEqual(premiumItem.price, 353.1);
    assert.strictEqual(premiumItem.change, 0);
    assert.strictEqual(premiumItem.trend, "unchanged");
  });

  it("should accurately calculate vehicle tank costs", () => {
    const calc = calculateTankCost("gasolina-premium", 10);
    assert.strictEqual(calc.currentCost, 3531.0);
    assert.strictEqual(calc.differenceCost, 0);
  });

  it("should generate valid time series for charting", () => {
    const series = getFuelTimeSeries("gasolina-premium", 12);
    assert.strictEqual(series.length, 12);
    const last = series[series.length - 1];
    assert.strictEqual(last.price, 353.1);
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
  it("should calculate next Friday 1:00 PM announcement", () => {
    // Reference on Wednesday Oct 7, 2026
    const ref = new Date("2026-10-07T14:00:00Z");
    const nextFriday = getNextAnnouncementDate(ref);
    assert.ok(nextFriday instanceof Date);
    const diff = getTimeUntilAnnouncement(nextFriday, ref);
    assert.ok(diff.days >= 1);
    assert.strictEqual(diff.isPastOrImminent, false);
  });
});
