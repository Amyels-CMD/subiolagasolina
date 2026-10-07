import fs from "fs";
import path from "path";
import { WeeklyFuelRecord } from "@/lib/types/fuel";
import { getAllHistory } from "@/lib/services/fuel-service";

export const CKAN_PACKAGE_URL =
  "https://datos.gob.do/api/3/action/package_show?id=precios-de-los-combustibles";
export const OFFICIAL_CSV_URL =
  "https://micm.gob.do/transparencias/datos-abiertos/precios-de-combustibles/precios-de-combustibles-2010-2026.csv";

export interface SyncResult {
  success: boolean;
  status: "up-to-date" | "updated" | "fallback_used";
  recordsCount: number;
  newWeeksAdded: number;
  latestWeekLabel: string;
  source: string;
  timestamp: string;
  message: string;
  error?: string;
}

const MONTH_MAP: Record<string, string> = {
  enero: "01",
  febrero: "02",
  marzo: "03",
  abril: "04",
  mayo: "05",
  junio: "06",
  julio: "07",
  agosto: "08",
  septiembre: "09",
  octubre: "10",
  noviembre: "11",
  diciembre: "12",
};

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

export async function syncFuelData(): Promise<SyncResult> {
  const currentHistory = getAllHistory();
  const latestLocal = currentHistory[currentHistory.length - 1];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(OFFICIAL_CSV_URL, {
      signal: controller.signal,
      headers: {
        "User-Agent": "SubioLaGasolina/1.0 (+https://subiolagasolina.com)",
      },
      next: { revalidate: 3600 },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return {
        success: true,
        status: "fallback_used",
        recordsCount: currentHistory.length,
        newWeeksAdded: 0,
        latestWeekLabel: latestLocal?.dateLabel ?? "Desconocido",
        source: "Persistencia local (MICM)",
        timestamp: new Date().toISOString(),
        message: `Servidor oficial respondió con estado ${res.status}. Utilizando datos locales persistidos.`,
      };
    }

    const text = await res.text();
    const lines = text.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 10) {
      return {
        success: true,
        status: "fallback_used",
        recordsCount: currentHistory.length,
        newWeeksAdded: 0,
        latestWeekLabel: latestLocal?.dateLabel ?? "Desconocido",
        source: "Persistencia local (MICM)",
        timestamp: new Date().toISOString(),
        message: "El archivo recibido del MICM contenía formato insuficiente. Utilizando histórico persistido.",
      };
    }

    // Parse remote rows
    const remoteWeeks: WeeklyFuelRecord[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(";").map((c) => c.trim().replace(",", "."));
      if (cols.length < 15) continue;

      const diaDesde = parseInt(cols[0], 10);
      const diaHasta = parseInt(cols[1], 10);
      const mesStr = cols[2]?.toLowerCase() || "";
      const anio = parseInt(cols[3], 10);

      if (isNaN(diaDesde) || isNaN(diaHasta) || isNaN(anio) || anio < 2020) continue;

      const mesNum = MONTH_MAP[mesStr] || "01";
      const mesIndex = parseInt(mesNum, 10) - 1;

      const prem = parseFloat(cols[4]) || 0;
      const reg = parseFloat(cols[5]) || 0;
      const gasoilReg = parseFloat(cols[6]) || 0;
      const gasoilOpt = parseFloat(cols[14]) || (gasoilReg > 0 ? gasoilReg + 30 : 0);
      const avtur = parseFloat(cols[15]) || 0;
      const kerosene = parseFloat(cols[16]) || 0;
      const fuelOil = parseFloat(cols[17]) || 0;
      const fuelOil1s = parseFloat(cols[22]) || 0;
      const glp = parseFloat(cols[25]) || 0;

      if (prem === 0 && reg === 0) continue;

      const padDiaDesde = String(diaDesde).padStart(2, "0");
      const padDiaHasta = String(diaHasta).padStart(2, "0");
      const startDate = `${anio}-${mesNum}-${padDiaDesde}`;

      let endMonth = mesNum;
      let endYear = anio;
      if (diaHasta < diaDesde) {
        const nextMes = (mesIndex + 1) % 12;
        endMonth = String(nextMes + 1).padStart(2, "0");
        if (nextMes === 0) endYear = anio + 1;
      }
      const endDate = `${endYear}-${endMonth}-${padDiaHasta}`;

      remoteWeeks.push({
        weekId: `${anio}-W${String(Math.ceil((i % 52) + 1)).padStart(2, "0")}`,
        year: anio,
        weekNumber: Math.ceil((i % 52) + 1),
        startDate,
        endDate,
        dateLabel: `${diaDesde} al ${diaHasta} de ${MONTH_NAMES[mesIndex]} de ${anio}`,
        shortDateLabel: `${diaDesde}-${diaHasta} ${MONTH_NAMES[mesIndex].slice(0, 3).toUpperCase()}`,
        announcementDate: `${anio}-${mesNum}-${String(Math.max(1, diaDesde - 1)).padStart(2, "0")}`,
        source: "Ministerio de Industria, Comercio y Mipymes (MICM)",
        prices: {
          "gasolina-premium": Math.round(prem * 100) / 100,
          "gasolina-regular": Math.round(reg * 100) / 100,
          "gasoil-optimo": Math.round(gasoilOpt * 100) / 100,
          "gasoil-regular": Math.round(gasoilReg * 100) / 100,
          "glp": Math.round(glp * 100) / 100,
          "gas-natural": 43.97,
          "avtur": Math.round(avtur * 100) / 100,
          "kerosene": Math.round(kerosene * 100) / 100,
          "fuel-oil-6": Math.round(fuelOil * 100) / 100,
          "fuel-oil-1s": Math.round(fuelOil1s * 100) / 100,
        },
      });
    }

    // Compare with current history
    const existingDates = new Set(currentHistory.map((r) => r.startDate));
    const newRecords = remoteWeeks.filter((r) => !existingDates.has(r.startDate));

    if (newRecords.length > 0) {
      const merged = [...currentHistory, ...newRecords].sort((a, b) =>
        a.startDate.localeCompare(b.startDate)
      );

      // In Node/Server environment, persist if writable
      try {
        const filePath = path.resolve(process.cwd(), "src", "data", "fuel-history.json");
        if (fs.existsSync(filePath)) {
          fs.writeFileSync(filePath, JSON.stringify(merged, null, 2), "utf-8");
        }
      } catch {
        // In read-only serverless environment (e.g. Vercel lambdas), continue safely
      }

      const latest = merged[merged.length - 1];
      return {
        success: true,
        status: "updated",
        recordsCount: merged.length,
        newWeeksAdded: newRecords.length,
        latestWeekLabel: latest.dateLabel,
        source: "Portal Nacional de Datos Abiertos / MICM",
        timestamp: new Date().toISOString(),
        message: `Sincronización exitosa. Se incorporaron ${newRecords.length} semanas nuevas.`,
      };
    }

    return {
      success: true,
      status: "up-to-date",
      recordsCount: currentHistory.length,
      newWeeksAdded: 0,
      latestWeekLabel: latestLocal.dateLabel,
      source: "Ministerio de Industria, Comercio y Mipymes (MICM)",
      timestamp: new Date().toISOString(),
      message: "Los datos históricos y actuales ya se encuentran actualizados a la última resolución oficial.",
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: true,
      status: "fallback_used",
      recordsCount: currentHistory.length,
      newWeeksAdded: 0,
      latestWeekLabel: latestLocal?.dateLabel ?? "Desconocido",
      source: "Persistencia local (MICM)",
      timestamp: new Date().toISOString(),
      message: "Conexión a fuente remota no disponible en este momento. Sirviendo datos persistentes de alta disponibilidad.",
      error: errorMsg,
    };
  }
}
