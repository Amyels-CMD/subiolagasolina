import fs from "fs";
import path from "path";
import { WeeklyFuelRecord } from "@/lib/types/fuel";
import { getAllHistory } from "@/lib/services/fuel-service";
import { fetchLiveWti } from "./wti-service";

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
  setiembre: "09",
  octubre: "10",
  noviembre: "11",
  diciembre: "12",
};

const MONTH_NAMES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
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

function subtractDaysIso(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d - days));
  return dt.toISOString().slice(0, 10);
}

function diffDaysIso(dateA: string, dateB: string): number {
  return (
    (new Date(`${dateB}T00:00:00Z`).getTime() - new Date(`${dateA}T00:00:00Z`).getTime()) /
    86400000
  );
}

function makeIsoDate(year: number, monthNum: number, dayNum: number): string {
  return `${year}-${String(monthNum).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
}

function decodeHtmlText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&aacute;|&#225;/gi, "á")
    .replace(/&eacute;|&#233;/gi, "é")
    .replace(/&iacute;|&#237;/gi, "í")
    .replace(/&oacute;|&#243;/gi, "ó")
    .replace(/&uacute;|&#250;/gi, "ú")
    .replace(/&ntilde;|&#241;/gi, "ñ")
    .replace(/&Aacute;|&#193;/gi, "Á")
    .replace(/&Eacute;|&#201;/gi, "É")
    .replace(/&Iacute;|&#205;/gi, "Í")
    .replace(/&Oacute;|&#211;/gi, "Ó")
    .replace(/&Uacute;|&#218;/gi, "Ú")
    .replace(/&Ntilde;|&#209;/gi, "Ñ")
    .replace(/\s+/g, " ")
    .trim();
}

function parsePressReleaseHtml(artHtml: string, artUrl: string): WeeklyFuelRecord | null {
  const cleanText = decodeHtmlText(artHtml);

  const markerMatch = cleanText.match(
    /(?:dispone que los combustibles se comercialicen|se comercialicen a los siguientes precios|se comercializar[aá]n a los siguientes precios|los siguientes precios:)/i
  );
  if (!markerMatch || markerMatch.index === undefined) return null;
  const idx = markerMatch.index;

  const context = cleanText.slice(Math.max(0, idx - 350), idx + 120);
  const periodMatch = context.match(
    /semana del (\d+)(?:ro|ero)?(?:\s+(?:de\s+)?(?!al\b)([a-záéíóúñ]+))?(?:\s+(?:de\s+)?(\d{4}))?\s+al\s+(\d+)(?:ro|ero)?\s+(?:de\s+)?([a-záéíóúñ]+)(?:\s+(?:del?(?:\s+año)?\s+)?(\d{4}))?/i
  );
  if (!periodMatch) return null;

  const diaDesde = parseInt(periodMatch[1], 10);
  const mesDesdeStr = periodMatch[2]?.toLowerCase();
  const anioDesdeStr = periodMatch[3];
  const diaHasta = parseInt(periodMatch[4], 10);
  const mesHastaStr = periodMatch[5].toLowerCase();
  const anioHasta = periodMatch[6] ? parseInt(periodMatch[6], 10) : new Date().getUTCFullYear();

  const mesHastaNum = MONTH_MAP[mesHastaStr];
  if (!mesHastaNum) return null;

  const mesDesdeNum =
    mesDesdeStr && MONTH_MAP[mesDesdeStr]
      ? MONTH_MAP[mesDesdeStr]
      : diaHasta < diaDesde
      ? String(parseInt(mesHastaNum, 10) === 1 ? 12 : parseInt(mesHastaNum, 10) - 1).padStart(
          2,
          "0"
        )
      : mesHastaNum;

  const anioDesde = anioDesdeStr
    ? parseInt(anioDesdeStr, 10)
    : parseInt(mesDesdeNum, 10) > parseInt(mesHastaNum, 10)
    ? anioHasta - 1
    : anioHasta;

  const startDate = `${anioDesde}-${mesDesdeNum}-${String(diaDesde).padStart(2, "0")}`;
  const endDate = `${anioHasta}-${mesHastaNum}-${String(diaHasta).padStart(2, "0")}`;

  const mesDesdeIndex = parseInt(mesDesdeNum, 10) - 1;
  const mesHastaIndex = parseInt(mesHastaNum, 10) - 1;

  let dateLabel: string;
  if (anioDesde !== anioHasta) {
    dateLabel = `${diaDesde} de ${MONTH_NAMES[mesDesdeIndex]} de ${anioDesde} al ${diaHasta} de ${MONTH_NAMES[mesHastaIndex]} de ${anioHasta}`;
  } else if (mesDesdeNum === mesHastaNum) {
    dateLabel = `${diaDesde} al ${diaHasta} de ${MONTH_NAMES[mesHastaIndex]} de ${anioHasta}`;
  } else {
    dateLabel = `${diaDesde} de ${MONTH_NAMES[mesDesdeIndex]} al ${diaHasta} de ${MONTH_NAMES[mesHastaIndex]} de ${anioHasta}`;
  }

  const shortDateLabel =
    mesDesdeNum === mesHastaNum
      ? `${diaDesde}-${diaHasta} ${MONTH_NAMES[mesHastaIndex].slice(0, 3).toUpperCase()}`
      : `${diaDesde} ${MONTH_NAMES[mesDesdeIndex].slice(0, 3).toUpperCase()} - ${diaHasta} ${MONTH_NAMES[mesHastaIndex].slice(0, 3).toUpperCase()}`;

  const priceSection = cleanText.slice(idx, idx + 1400);

  function extractPrice(regex: RegExp) {
    const m = priceSection.match(regex);
    if (!m) return null;
    return parseFloat(m[1].replace(",", "."));
  }

  const prem = extractPrice(/Gasolina Pr[eé]mium[^\d]*?RD\$\s*([\d]+(?:[.,]\d+)?)/i);
  const reg = extractPrice(/Gasolina Regular[^\d]*?RD\$\s*([\d]+(?:[.,]\d+)?)/i);
  const gasoilReg = extractPrice(/Gasoil Regular[^\d]*?RD\$\s*([\d]+(?:[.,]\d+)?)/i);
  const gasoilOpt = extractPrice(/Gasoil [ÓO]ptimo[^\d]*?RD\$\s*([\d]+(?:[.,]\d+)?)/i);
  const avtur = extractPrice(/Avtur[^\d]*?RD\$\s*([\d]+(?:[.,]\d+)?)/i);
  const kerosene = extractPrice(/Kerosene[^\d]*?RD\$\s*([\d]+(?:[.,]\d+)?)/i);
  const fuelOil6 = extractPrice(/Fuel O[íi]l #?6[^\d]*?RD\$\s*([\d]+(?:[.,]\d+)?)/i);
  const fuelOil1s = extractPrice(/Fuel O[íi]l 1%S[^\d]*?RD\$\s*([\d]+(?:[.,]\d+)?)/i);
  const glp = extractPrice(
    /(?:GLP|Gas Licuado de Petr[óo]leo \(GLP\))[^\d]*?RD\$\s*([\d]+(?:[.,]\d+)?)/i
  );
  const gnv = extractPrice(/Gas Natural[^\d]*?RD\$\s*([\d]+(?:[.,]\d+)?)/i) || 43.97;

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
    announcementDate: subtractDaysIso(startDate, 1),
    source: "Nota de Prensa Oficial MICM",
    officialBulletinUrl: artUrl,
    prices: {
      "gasolina-premium": Math.round(prem * 100) / 100,
      "gasolina-regular": Math.round(reg * 100) / 100,
      "gasoil-optimo": Math.round((gasoilOpt || (gasoilReg ? gasoilReg + 30 : 0)) * 100) / 100,
      "gasoil-regular": Math.round((gasoilReg || 0) * 100) / 100,
      glp: Math.round((glp || 0) * 100) / 100,
      "gas-natural": gnv,
      avtur: Math.round((avtur || 0) * 100) / 100,
      kerosene: Math.round((kerosene || 0) * 100) / 100,
      "fuel-oil-6": Math.round((fuelOil6 || 0) * 100) / 100,
      "fuel-oil-1s": Math.round((fuelOil1s || 0) * 100) / 100,
    },
  };
}

async function scrapeOfficialPressReleases(): Promise<WeeklyFuelRecord[]> {
  try {
    const res = await fetch(NOTICIAS_URL, {
      signal: AbortSignal.timeout(10000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) subiolagasolina-bot/1.0",
      },
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const html = await res.text();

    const matches = [...html.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
    const seenUrls = new Set<string>();
    const candidateUrls: string[] = [];

    for (const m of matches) {
      const rawHref = (m[1] || "").trim();
      if (!rawHref || rawHref.startsWith("#") || /^(mailto|tel|javascript):/i.test(rawHref)) {
        continue;
      }

      let fullUrl: string;
      try {
        fullUrl = new URL(rawHref, NOTICIAS_URL).href;
      } catch {
        continue;
      }

      if (!fullUrl.includes("micm.gob.do/")) continue;
      if (
        /\/(?:direcciones|categoria|tag|author|page|transparencias|wp-content|noticias\/?$)/i.test(
          fullUrl
        ) ||
        /\.pdf$/i.test(fullUrl)
      ) {
        continue;
      }

      const text = decodeHtmlText(m[2] || "");
      const mentionsFuels =
        /combustible|gasolina|gasoil|glp|hidrocarburo/i.test(fullUrl) ||
        /combustible|gasolina|gasoil|glp|hidrocarburo/i.test(text);
      if (!mentionsFuels) continue;

      const dedupKey = fullUrl.replace(/\/+$/, "").toLowerCase();
      if (seenUrls.has(dedupKey)) continue;
      seenUrls.add(dedupKey);
      candidateUrls.push(fullUrl);
      if (candidateUrls.length >= 12) break;
    }

    const records: WeeklyFuelRecord[] = [];
    const seenDates = new Set<string>();

    for (let i = 0; i < candidateUrls.length; i += 4) {
      const batch = candidateUrls.slice(i, i + 4);
      const settled = await Promise.allSettled(
        batch.map(async (artUrl) => {
          const artRes = await fetch(artUrl, {
            signal: AbortSignal.timeout(10000),
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) subiolagasolina-bot/1.0",
            },
            next: { revalidate: 300 },
          });
          if (!artRes.ok) return null;
          const artHtml = await artRes.text();
          return parsePressReleaseHtml(artHtml, artUrl);
        })
      );

      for (const item of settled) {
        if (item.status === "fulfilled" && item.value && !seenDates.has(item.value.startDate)) {
          seenDates.add(item.value.startDate);
          records.push(item.value);
        }
      }
    }

    return records.sort((a, b) => a.startDate.localeCompare(b.startDate));
  } catch {
    return [];
  }
}

export async function syncFuelData(): Promise<SyncResult> {
  const currentHistory = getAllHistory();
  const latestLocal = currentHistory[currentHistory.length - 1];

  try {
    // Sincronizar cotización internacional del Crudo WTI (Texas)
    await fetchLiveWti().catch(() => {});

    // 1. Check Press Releases (Fastest Friday Announcement & exact decimals)
    const pressRecords = await scrapeOfficialPressReleases();
    const newPressRecords = pressRecords.filter((r) => r.startDate > latestLocal.startDate);

    if (newPressRecords.length > 0) {
      const merged = [...currentHistory, ...newPressRecords].sort((a, b) =>
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
        newWeeksAdded: newPressRecords.length,
        latestWeekLabel: latest.dateLabel,
        source: "Nota de Prensa Oficial MICM",
        timestamp: new Date().toISOString(),
        message: `Sincronización exitosa desde Notas de Prensa oficiales (${newPressRecords.length} semana(s)): ${latest.dateLabel}.`,
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
      const lines = text
        .trim()
        .split(/\r?\n/)
        .filter((l) => l.trim().length > 0);

      if (lines.length >= 10) {
        const remoteWeeks: WeeklyFuelRecord[] = [];
        let prevEndDate: string | null = null;
        const todayIso = new Date().toISOString().slice(0, 10);

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(";").map((c) => c.trim().replace(",", "."));
          if (cols.length < 15) continue;

          const diaDesde = parseInt(cols[0], 10);
          const diaHasta = parseInt(cols[1], 10);
          const mesStr = cols[2]?.toLowerCase() || "";
          const anio = parseInt(cols[3], 10);

          if (isNaN(diaDesde) || isNaN(diaHasta) || isNaN(anio) || anio < 2020) continue;

          const mesNumStr = MONTH_MAP[mesStr];
          if (!mesNumStr) continue;
          const mesNum = parseInt(mesNumStr, 10);

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

          let startYear = anio;
          let startMonth = mesNum;
          let endYear = anio;
          let endMonth = mesNum;

          if (diaHasta < diaDesde) {
            const optAStart = makeIsoDate(anio, mesNum, diaDesde);
            const optAMonthEnd = mesNum === 12 ? 1 : mesNum + 1;
            const optAYearEnd = mesNum === 12 ? anio + 1 : anio;

            const optBMonthStart = mesNum === 1 ? 12 : mesNum - 1;
            const optBYearStart = mesNum === 1 ? anio - 1 : anio;
            const optBStart = makeIsoDate(optBYearStart, optBMonthStart, diaDesde);

            if (prevEndDate) {
              const diffA = diffDaysIso(prevEndDate, optAStart);
              const diffB = diffDaysIso(prevEndDate, optBStart);
              if (Math.abs(diffB) <= 5 && Math.abs(diffA) > 15) {
                startYear = optBYearStart;
                startMonth = optBMonthStart;
                endYear = anio;
                endMonth = mesNum;
              } else {
                startYear = anio;
                startMonth = mesNum;
                endYear = optAYearEnd;
                endMonth = optAMonthEnd;
              }
            } else {
              endYear = optAYearEnd;
              endMonth = optAMonthEnd;
            }
          }

          const startDate = makeIsoDate(startYear, startMonth, diaDesde);
          const endDate = makeIsoDate(endYear, endMonth, diaHasta);
          prevEndDate = endDate;

          const startMonthIdx = startMonth - 1;
          const endMonthIdx = endMonth - 1;
          const dateLabel =
            startYear !== endYear
              ? `${diaDesde} de ${MONTH_NAMES[startMonthIdx]} de ${startYear} al ${diaHasta} de ${MONTH_NAMES[endMonthIdx]} de ${endYear}`
              : startMonth === endMonth
              ? `${diaDesde} al ${diaHasta} de ${MONTH_NAMES[endMonthIdx]} de ${endYear}`
              : `${diaDesde} de ${MONTH_NAMES[startMonthIdx]} al ${diaHasta} de ${MONTH_NAMES[endMonthIdx]} de ${endYear}`;

          const shortDateLabel =
            startMonth === endMonth
              ? `${diaDesde}-${diaHasta} ${MONTH_NAMES[endMonthIdx].slice(0, 3).toUpperCase()}`
              : `${diaDesde} ${MONTH_NAMES[startMonthIdx].slice(0, 3).toUpperCase()} - ${diaHasta} ${MONTH_NAMES[endMonthIdx].slice(0, 3).toUpperCase()}`;

          const iso = getIsoWeek(startDate);
          const weekId = `${iso.year}-W${String(iso.week).padStart(2, "0")}`;

          remoteWeeks.push({
            weekId,
            year: iso.year,
            weekNumber: iso.week,
            startDate,
            endDate,
            dateLabel,
            shortDateLabel,
            announcementDate: subtractDaysIso(startDate, 1),
            source: "CSV Datos Abiertos MICM",
            prices: {
              "gasolina-premium": Math.round(prem * 100) / 100,
              "gasolina-regular": Math.round(reg * 100) / 100,
              "gasoil-optimo": Math.round(gasoilOpt * 100) / 100,
              "gasoil-regular": Math.round(gasoilReg * 100) / 100,
              glp: Math.round(glp * 100) / 100,
              "gas-natural": 43.97,
              avtur: Math.round(avtur * 100) / 100,
              kerosene: Math.round(kerosene * 100) / 100,
              "fuel-oil-6": Math.round(fuelOil * 100) / 100,
              "fuel-oil-1s": Math.round(fuelOil1s * 100) / 100,
            },
          });
        }

        const newRecords = remoteWeeks.filter(
          (r) => r.startDate > latestLocal.startDate && diffDaysIso(todayIso, r.startDate) <= 10
        );

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
      message:
        "Los datos históricos y actuales ya se encuentran actualizados a la última resolución oficial.",
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
      message:
        "Conexión a fuente remota no disponible en este momento. Sirviendo datos persistentes de alta disponibilidad.",
      error: errorMsg,
    };
  }
}
