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

export interface WeeklySummary {
  currentWeek: WeeklyFuelRecord;
  previousWeek: WeeklyFuelRecord;
  hasIncreased: boolean;
  hasDecreased: boolean;
  isUnchanged: boolean;
  headlineVerdict: "NO, SE MANTUVO" | "¡BAJÓ!" | "SÍ, SUBIÓ";
  subVerdict: string;
  badgeTone: "neutral" | "success" | "danger" | "warning";
  items: FuelPriceItem[];
  consumerItems: FuelPriceItem[];
  industrialItems: FuelPriceItem[];
  nextUpdateDate: string; // ISO timestamp
}

export interface TankCalculationResult {
  fuelId: FuelId;
  gallons: number;
  currentCost: number;
  previousCost: number;
  differenceCost: number;
}
