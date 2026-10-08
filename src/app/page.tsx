import React from "react";
import { getAllHistory, getWeeklySummary } from "@/lib/services/fuel-service";
import { HeroVerdict } from "@/components/HeroVerdict";
import { FuelCardsGrid } from "@/components/FuelCardsGrid";
import { EvolutionChart } from "@/components/EvolutionChart";
import { TankCalculator } from "@/components/TankCalculator";
import { HistoricalTable } from "@/components/HistoricalTable";
import { FaqSection } from "@/components/FaqSection";
import { FuelSupportSection } from "@/components/FuelSupportSection";
import { QuickFactsSummary } from "@/components/QuickFactsSummary";
import { JsonLd } from "@/components/JsonLd";

export default async function HomePage() {
  const summary = getWeeklySummary();
  const history = getAllHistory();

  return (
    <>
      <JsonLd summary={summary} />

      {/* Hero Section with Verdict & Share Bar */}
      <HeroVerdict summary={summary} />

      {/* Unboxed Financial Terminal Ribbon */}
      <QuickFactsSummary summary={summary} />

      {/* Current Prices Cards Grid */}
      <FuelCardsGrid
        consumerItems={summary.consumerItems}
        industrialItems={summary.industrialItems}
      />

      {/* Historical Evolution Interactive Chart */}
      <EvolutionChart history={history} initialFuelId="gasolina-premium" />

      {/* Tank Fill Cost Calculator */}
      <TankCalculator
        currentWeek={summary.currentWeek}
        previousWeek={summary.previousWeek}
      />

      {/* Full Historical Table with Search and CSV Export */}
      <HistoricalTable history={history} />

      {/* SEO FAQ & Dominican Guide */}
      <FaqSection />

      {/* Buy Me a Coffee / Invítame un Galón */}
      <FuelSupportSection
        premiumPrice={summary.currentWeek.prices["gasolina-premium"]}
        regularPrice={summary.currentWeek.prices["gasolina-regular"]}
      />
    </>
  );
}
