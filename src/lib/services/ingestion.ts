import fs from "fs";
import path from "path";
import { WeeklyFuelRecord } from "@/lib/types/fuel";
import { getAllHistory } from "@/lib/services/fuel-service";

export const CKAN_PACKAGE_URL =
  "https://datos.gob.do/api/3/action/package_show?id=precios-de-los-combustibles";
export const OFFICIAL_CSV_URL =
  "https://micm.gob.do/transparencias/datos-abiertos/precios-de-combustibles/precios-de-combustibles-2010-2026.csv";
export const NOTICIAS_URL = "https://micm.gob.do/noticias/";

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

function getIsoWeek(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: date.getUTCFullYear(), week: weekNo };
}

async function scrapeOfficialPressRelease(): Promise<WeeklyFuelRecord | null> {
  try {
    const res = await fetch(NOTICIAS_URL, {
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) subiolagasolina-bot/1.0" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const html = await res.text();

    const matches = [...html.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
    const article = matches.find((m) => {
      const href = m[1] || "";
      const text = (m[2] || "").replace(/<[^>]+>/g, " ").trim();
      if (href.includes("/direcciones/") || href.includes("/categoria/")) return false;

      const isFuelGovArticle =
        /gobierno-(?:congela|reajusta|mantiene|dispone|anuncia|subsidia)/i.test(href) ||
        /(?:precios?-de?-los?-combustibles)/i.test(href);

      const mentionsFuels =
        /combustible|gasolina|gasoil|glp/i.test(href) ||
        /combustible|gasolina|gasoil|glp/i.test(text);

      return isFuelGovArticle && mentionsFuels;
    });
    if (!article) return null;

    const artUrl = article[1];
    const artRes = await fetch(artUrl, {
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) subiolagasolina-bot/1.0" },
      next: { revalidate: 300 },
    });
    if (!artRes.ok) return null;
    const artHtml = await artRes.text();

    const cleanText = artHtml
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ");

    const markerMatch = cleanText.match(
      /(?:dispone que los combustibles se comercialicen|se comercialicen a los siguientes precios|los siguientes precios:)/i
    );
    if (!markerMatch || markerMatch.index === undefined) return null;
    const idx = markerMatch.index;

    // Buscar período de la semana (soporta semana dentro del mismo mes o cruce de meses/años)
    const context = cleanText.slice(Math.max(0, idx - 250), idx + 100);
    const periodMatch = context.match(
      /semana del (\d+)(?: de ([a-záéíóú]+))?(?: de (\d{4}))? al (\d+) de ([a-záéíóú]+) de (\d{4})/i
    );
    if (!periodMatch) return null;

    const diaDesde = parseInt(periodMatch[1], 10);
    const mesDesdeStr = periodMatch[2]?.toLowerCase();
    const anioDesdeStr = periodMatch[3];
    const diaHasta = parseInt(periodMatch[4], 10);
    const mesHastaStr = periodMatch[5].toLowerCase();
    const anioHasta = parseInt(periodMatch[6], 10);

    const mesHastaNum = MONTH_MAP[mesHastaStr] || "01";
    const mesDesdeNum = mesDesdeStr
      ? MONTH_MAP[mesDesdeStr] || mesHastaNum
      : diaHasta < diaDesde
      ? String(parseInt(mesHastaNum, 10) === 1 ? 12 : parseInt(mesHastaNum, 10) - 1).padStart(2, "0")
      : mesHastaNum;
    const anioDesde = anioDesdeStr
      ? parseInt(anioDesdeStr, 10)
      : diaHasta < diaDesde && !mesDesdeStr && mesHastaNum === "01"
      ? anioHasta - 1
      : anioHasta;

    const startDate = `${anioDesde}-${mesDesdeNum}-${String(diaDesde).padStart(2, "0")}`;
    const endDate = `${anioHasta}-${mesHastaNum}-${String(diaHasta).padStart(2, "0")}`;

    const mesDesdeIndex = parseInt(mesDesdeNum, 10) - 1;
    const mesHastaIndex = parseInt(mesHastaNum, 10) - 1;
    const dateLabel =
      mesDesdeNum === mesHastaNum
        ? `${diaDesde} al ${diaHasta} de ${MONTH_NAMES[mesHastaIndex]} de ${anioHasta}`
        : `${diaDesde} de ${MONTH_NAMES[mesDesdeIndex]} al ${diaHasta} de ${MONTH_NAMES[mesHastaIndex]} de ${anioHasta}`;
    const shortDateLabel =
      mesDesdeNum === mesHastaNum
        ? `${diaDesde}-${diaHasta} ${MONTH_NAMES[mesHastaIndex].slice(0, 3).toUpperCase()}`
        : `${diaDesde} ${MONTH_NAMES[mesDesdeIndex].slice(0, 3).toUpperCase()}-${diaHasta} ${MONTH_NAMES[mesHastaIndex].slice(0, 3).toUpperCase()}`;

    const priceSection = cleanText.slice(idx, idx + 1200);

    function extractPrice(regex: RegExp) {
      const m = priceSection.match(regex);
      if (!m) return null;
      return parseFloat(m[1].replace(",", "."));
    }

    const prem = extractPrice(/Gasolina Premium[^\d]*?RD\$\s*([\d.]+)/i);
    const reg = extractPrice(/Gasolina Regular[^\d]*?RD\$\s*([\d.]+)/i);
    const gasoilReg = extractPrice(/Gasoil Regular[^\d]*?RD\$\s*([\d.]+)/i);
    const gasoilOpt = extractPrice(/Gasoil [ÓO]ptimo[^\d]*?RD\$\s*([\d.]+)/i);
    const avtur = extractPrice(/Avtur[^\d]*?RD\$\s*([\d.]+)/i);
    const kerosene = extractPrice(/Kerosene[^\d]*?RD\$\s*([\d.]+)/i);
    const fuelOil6 = extractPrice(/Fuel O[íi]l #6[^\d]*?RD\$\s*([\d.]+)/i);
    const fuelOil1s = extractPrice(/Fuel O[íi]l 1%S[^\d]*?RD\$\s*([\d.]+)/i);
    const glp = extractPrice(/(?:GLP|Gas Licuado de Petr[óo]leo \(GLP\))[^\d]*?RD\$\s*([\d.]+)/i);
    const gnv = extractPrice(/Gas Natural[^\d]*?RD\$\s*([\d.]+)/i) || 43.97;

    if (!prem || !reg) return null;

    const iso = getIsoWeek(startDate);
    const weekId = `${iso.year}-W${String(iso.week).padStart(2, "0")}`;

    return {
      weekId,
      year: iso.year,
      weekNumber: iso.week,
      startDate,
      endDate,
      dateLabel,
      shortDateLabel,
      announcementDate: `${anioHasta}-${mesHastaNum}-${String(Math.max(1, diaDesde - 1)).padStart(2, "0")}`,
      source: "Nota de Prensa Oficial MICM",
      officialBulletinUrl: artUrl,
      prices: {
        "gasolina-premium": Math.round(prem * 100) / 100,
        "gasolina-regular": Math.round(reg * 100) / 100,
        "gasoil-optimo": Math.round((gasoilOpt || (gasoilReg ? gasoilReg + 30 : 0)) * 100) / 100,
        "gasoil-regular": Math.round((gasoilReg || 0) * 100) / 100,
        "glp": Math.round((glp || 0) * 100) / 100,
        "gas-natural": gnv,
        "avtur": Math.round((avtur || 0) * 100) / 100,
        "kerosene": Math.round((kerosene || 0) * 100) / 100,
        "fuel-oil-6": Math.round((fuelOil6 || 0) * 100) / 100,
        "fuel-oil-1s": Math.round((fuelOil1s || 0) * 100) / 100,
      },
    };
  } catch {
    return null;
  }
}

export async function syncFuelData(): Promise<SyncResult> {
  const currentHistory = getAllHistory();
  const latestLocal = currentHistory[currentHistory.length - 1];

  try {
    // 1. Check Press Release (Fastest Friday Announcement)
    const pressRecord = await scrapeOfficialPressRelease();
    if (pressRecord && pressRecord.startDate > latestLocal.startDate) {
      const merged = [...currentHistory, pressRecord].sort((a, b) =>
        a.startDate.localeCompare(b.startDate)
      );

      try {
        const filePath = path.resolve(process.cwd(), "src", "data", "fuel-history.json");
        if (fs.existsSync(filePath)) {
          fs.writeFileSync(filePath, JSON.stringify(merged, null, 2), "utf-8");
        }
      } catch {
        // Read-only serverless fallback
      }

      return {
        success: true,
        status: "updated",
        recordsCount: merged.length,
        newWeeksAdded: 1,
        latestWeekLabel: pressRecord.dateLabel,
        source: "Nota de Prensa Oficial MICM",
        timestamp: new Date().toISOString(),
        message: `Sincronización exitosa desde Nota de Prensa oficial: ${pressRecord.dateLabel}.`,
      };
    }

    // 2. Check Official CSV
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

    if (res.ok) {
      const text = await res.text();
      const lines = text.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);

      if (lines.length >= 10) {
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

          const iso = getIsoWeek(startDate);
          const weekId = `${iso.year}-W${String(iso.week).padStart(2, "0")}`;

          remoteWeeks.push({
            weekId,
            year: iso.year,
            weekNumber: iso.week,
            startDate,
            endDate,
            dateLabel: `${diaDesde} al ${diaHasta} de ${MONTH_NAMES[mesIndex]} de ${anio}`,
            shortDateLabel: `${diaDesde}-${diaHasta} ${MONTH_NAMES[mesIndex].slice(0, 3).toUpperCase()}`,
            announcementDate: `${anio}-${mesNum}-${String(Math.max(1, diaDesde - 1)).padStart(2, "0")}`,
            source: "CSV Datos Abiertos MICM",
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

        const existingDates = new Set(currentHistory.map((r) => r.startDate));
        const newRecords = remoteWeeks.filter((r) => !existingDates.has(r.startDate));

        if (newRecords.length > 0) {
          const merged = [...currentHistory, ...newRecords].sort((a, b) =>
            a.startDate.localeCompare(b.startDate)
          );

          try {
            const filePath = path.resolve(process.cwd(), "src", "data", "fuel-history.json");
            if (fs.existsSync(filePath)) {
              fs.writeFileSync(filePath, JSON.stringify(merged, null, 2), "utf-8");
            }
          } catch {
            // Read-only serverless fallback
          }

          const latest = merged[merged.length - 1];
          return {
            success: true,
            status: "updated",
            recordsCount: merged.length,
            newWeeksAdded: newRecords.length,
            latestWeekLabel: latest.dateLabel,
            source: "CSV Datos Abiertos MICM",
            timestamp: new Date().toISOString(),
            message: `Sincronización exitosa desde CSV. Se incorporaron ${newRecords.length} semanas nuevas.`,
          };
        }
      }
    }

    return {
      success: true,
      status: "up-to-date",
      recordsCount: currentHistory.length,
      newWeeksAdded: 0,
      latestWeekLabel: latestLocal.dateLabel,
      source: "MICM (Nota de Prensa / CSV)",
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
