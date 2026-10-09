export type FuelId =
  | "gasolina-premium"
  | "gasolina-regular"
  | "gasoil-optimo"
  | "gasoil-regular"
  | "glp"
  | "gas-natural"
  | "avtur"
  | "kerosene"
  | "fuel-oil-6"
  | "fuel-oil-1s";

export type FuelCategory = "consumer" | "industrial";

export type TrendDirection = "up" | "down" | "unchanged";

export interface FuelMeta {
  id: FuelId;
  name: string;
  shortName: string;
  category: FuelCategory;
  unit: "galón" | "m³";
  description: string;
  octaneOrSpec?: string;
  commonUsage: string;
  color: {
    primary: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    chartColor: string;
  };
}

export interface FuelPriceItem {
  id: FuelId;
  name: string;
  price: number;
  previousPrice: number;
  change: number; // positive = subió, negative = bajó, 0 = se mantuvo
  percentageChange: number;
  trend: TrendDirection;
  unit: "galón" | "m³";
}

export interface WeeklyFuelRecord {
  weekId: string; // e.g. "2026-W40"
  year: number;
  weekNumber: number;
  startDate: string; // ISO "2026-10-03"
  endDate: string; // ISO "2026-10-09"
  dateLabel: string; // "3 al 9 de octubre de 2026"
  shortDateLabel: string; // "3-9 Oct 2026"
  resolutionNumber?: string;
  announcementDate: string; // ISO "2026-10-02" (Viernes previo)
  source: string; // "Ministerio de Industria, Comercio y Mipymes (MICM)"
  officialBulletinUrl?: string;
  prices: Record<FuelId, number>;
}

export interface WtiBenchmark {
  priceUsd: number;
  changeUsd: number;
  percentageChange: number;
  trend: TrendDirection;
  label: string;
}

export type AggregateMovement = "unchanged" | "increased" | "decreased" | "mixed";

export type HeadlineVerdict = "NO, SE MANTUVO" | "¡BAJÓ!" | "SÍ, SUBIÓ";

export interface ScopeStatus {
  state: AggregateMovement;
  hasIncreased: boolean;
  hasDecreased: boolean;
  isUnchanged: boolean;
  summaryText?: string;
  headline?: HeadlineVerdict;
  answer?: "SÍ" | "NO";
}

export interface ScopesSummary {
  gasoline: ScopeStatus;
  consumer: ScopeStatus;
  market: ScopeStatus;
}

export interface StructuredVerdicts {
  gasoline: {
    answer: "SÍ" | "NO";
    primaryWord: "NO." | "SÍ." | "BAJÓ.";
    secondaryPhrase: string;
    headline: HeadlineVerdict;
    subtext: string;
    tone: "neutral" | "success" | "danger" | "warning";
    hasIncreased: boolean;
    hasDecreased: boolean;
    isUnchanged: boolean;
  };
  consumer: {
    state: AggregateMovement;
    summaryText: string;
    hasNotableOtherChanges: boolean;
    notableChangeSummary?: string;
    hasIncreased: boolean;
    hasDecreased: boolean;
    isUnchanged: boolean;
  };
  market: {
    state: AggregateMovement;
    summaryText: string;
    hasNotableOtherChanges: boolean;
    hasIncreased: boolean;
    hasDecreased: boolean;
    isUnchanged: boolean;
  };
}

export interface CategorizedChanges {
  up: FuelPriceItem[];
  down: FuelPriceItem[];
  unchanged: FuelPriceItem[];
}

export interface WeeklySummary {
  // Scoped state machines & detailed status
  gasolineState: AggregateMovement;
  consumerState: AggregateMovement;
  marketState: AggregateMovement;
  scopes: ScopesSummary;
  verdicts: StructuredVerdicts;
  changes: CategorizedChanges;

  // Contextual intelligence for non-gasoline fuels (never hidden)
  hasNotableOtherChanges: boolean;
  hasOtherConsumerChanges: boolean;
  hasIndustrialChanges: boolean;
  notableChangeSummary?: string;

  // Historical records (canonical single source of truth)
  currentWeek: WeeklyFuelRecord;
  previousWeek: WeeklyFuelRecord;

  // Backward compatibility fields (Ámbito explícito: Gasolinas Premium y Regular)
  /**
   * Indica si alguna gasolina (Premium o Regular) registró aumento de precio.
   * Ámbito: Exclusivo gasolinas.
   */
  hasIncreased: boolean;
  /**
   * Indica si alguna gasolina (Premium o Regular) registró rebaja de precio.
   * Ámbito: Exclusivo gasolinas.
   */
  hasDecreased: boolean;
  /**
   * Indica si ambas gasolinas (Premium y Regular) permanecieron sin cambios.
   * Ámbito: Exclusivo gasolinas.
   */
  isUnchanged: boolean;
  headlineVerdict: HeadlineVerdict;
  subVerdict: string;
  badgeTone: "neutral" | "success" | "danger" | "warning";
  items: FuelPriceItem[];
  consumerItems: FuelPriceItem[];
  industrialItems: FuelPriceItem[];
  nextUpdateDate: string; // ISO 8601 UTC timestamp (e.g. 2026-10-09T17:00:00.000Z)
  nextUpdateDateDominican?: string; // Fecha formateada en hora local dominicana (AST / UTC-4)
  wti?: WtiBenchmark;
}


export interface TankCalculationResult {
  fuelId: FuelId;
  gallons: number;
  currentCost: number;
  previousCost: number;
  differenceCost: number;
}
