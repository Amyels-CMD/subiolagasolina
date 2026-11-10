import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const HISTORY_PATH = path.resolve("src", "data", "fuel-history.json");
const WTI_PATH = path.resolve("src", "data", "wti-benchmark.json");
const CSV_URL =
  "https://micm.gob.do/transparencias/datos-abiertos/precios-de-combustibles/precios-de-combustibles-2010-2026.csv";
const NOTICIAS_URL = "https://micm.gob.do/noticias/";

const WTI_ENDPOINTS = [
  "https://query1.finance.yahoo.com/v8/finance/chart/CL=F?interval=1d&range=5d",
  "https://query2.finance.yahoo.com/v8/finance/chart/CL=F?interval=1d&range=5d",
];

const MONTH_MAP = {
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

export function getIsoWeek(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: date.getUTCFullYear(), week: weekNo };
}

export function subtractDaysIso(dateStr, days) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d - days));
  return dt.toISOString().slice(0, 10);
}

function diffDaysIso(dateA, dateB) {
  return (
    (new Date(`${dateB}T00:00:00Z`).getTime() - new Date(`${dateA}T00:00:00Z`).getTime()) /
    86400000
  );
}

function makeIsoDate(year, monthNum, dayNum) {
  return `${year}-${String(monthNum).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
}

export function decodeHtmlText(html) {
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

export function parsePeriodFromText(context) {
  // Tolerates optional "de" before month/year (e.g. "semana del 24 al 30 de octubre 2026")
  // and ordinal "1ro" / "1ero" for first day of month.
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

  let dateLabel;
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

  return {
    startDate,
    endDate,
    dateLabel,
    shortDateLabel,
    announcementDate: subtractDaysIso(startDate, 1),
  };
}

export function parsePressReleaseHtml(artHtml, artUrl) {
  const cleanText = decodeHtmlText(artHtml);

  const markerMatch = cleanText.match(
    /(?:dispone que los combustibles se comercialicen|se comercialicen a los siguientes precios|se comercializar[aá]n a los siguientes precios|los siguientes precios:)/i
  );
  if (!markerMatch || markerMatch.index === undefined) return null;
  const idx = markerMatch.index;

  const context = cleanText.slice(Math.max(0, idx - 350), idx + 120);
  const period = parsePeriodFromText(context);
  if (!period) return null;

  const priceSection = cleanText.slice(idx, idx + 1400);

  function extractPrice(regex) {
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

  const iso = getIsoWeek(period.startDate);
  const weekId = `${iso.year}-W${String(iso.week).padStart(2, "0")}`;

  return {
    weekId,
    year: iso.year,
    weekNumber: iso.week,
    startDate: period.startDate,
    endDate: period.endDate,
    dateLabel: period.dateLabel,
    shortDateLabel: period.shortDateLabel,
    announcementDate: period.announcementDate,
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

export function extractCandidateNewsUrls(html, maxCandidates = 15) {
  const matches = [...html.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
  const seen = new Set();
  const candidates = [];

  for (const m of matches) {
    const rawHref = (m[1] || "").trim();
    if (!rawHref || rawHref.startsWith("#") || /^(mailto|tel|javascript):/i.test(rawHref)) {
      continue;
    }

    let fullUrl;
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
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);
    candidates.push(fullUrl);

    if (candidates.length >= maxCandidates) break;
  }

  return candidates;
}

/**
 * Fuente 1 (Primaria): Scraper multi-artículo de notas de prensa oficiales del MICM.
 * Inspecciona los comunicados recientes de micm.gob.do/noticias/ para cubrir
 * semanas atrasadas y evitar que artículos no tarifarios bloqueen la ingesta.
 */
async function fetchFromPressReleases() {
  try {
    const res = await fetch(NOTICIAS_URL, {
      signal: AbortSignal.timeout(12000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) subiolagasolina-bot/1.0",
      },
    });
    if (!res.ok) return [];
    const html = await res.text();
    const candidateUrls = extractCandidateNewsUrls(html, 12);
    if (candidateUrls.length === 0) return [];

    const parsedRecords = [];
    const seenDates = new Set();

    // Fetch in small parallel batches of 4 to stay fast and polite to MICM
    for (let i = 0; i < candidateUrls.length; i += 4) {
      const batch = candidateUrls.slice(i, i + 4);
      const settled = await Promise.allSettled(
        batch.map(async (artUrl) => {
          const artRes = await fetch(artUrl, {
            signal: AbortSignal.timeout(12000),
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) subiolagasolina-bot/1.0",
            },
          });
          if (!artRes.ok) return null;
          const artHtml = await artRes.text();
          return parsePressReleaseHtml(artHtml, artUrl);
        })
      );

      for (const item of settled) {
        if (item.status === "fulfilled" && item.value) {
          if (!seenDates.has(item.value.startDate)) {
            seenDates.add(item.value.startDate);
            parsedRecords.push(item.value);
          }
        }
      }
    }

    return parsedRecords.sort((a, b) => a.startDate.localeCompare(b.startDate));
  } catch (err) {
    console.log("Notas de prensa no disponibles en este momento:", err.message);
    return [];
  }
}

export function parseOfficialCsvText(text) {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const records = [];
  let prevEndDate = null;

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
      // Disambiguate MICM CSV convention: sometimes MES is start month (e.g. Dec->Jan),
      // other times MICM puts the END month (e.g. "29;4;Septiembre" or "25;2;Octubre").
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

    records.push({
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

  return records.sort((a, b) => a.startDate.localeCompare(b.startDate));
}

/**
 * Fuente 2 (Secundaria): CSV consolidado de Datos Abiertos de MICM
 */
async function fetchFromOfficialCsv() {
  try {
    const res = await fetch(CSV_URL, {
      signal: AbortSignal.timeout(12000),
      headers: { "User-Agent": "subiolagasolina-bot/1.0" },
    });
    if (!res.ok) return [];
    const text = await res.text();
    if (text.trim().split(/\r?\n/).length < 10) return [];
    return parseOfficialCsvText(text);
  } catch (err) {
    console.log("CSV oficial no disponible en este momento:", err.message);
    return [];
  }
}

/**
 * Motor de Validación Cruzada y Contraste contra el Registro Actual
 * @param {any} candidate
 * @param {any} latestLocal
 * @param {Date | null} [referenceDate]
 */
export function validateCandidateAgainstLocal(candidate, latestLocal, referenceDate = null) {
  if (!candidate || !candidate.startDate || !candidate.prices) {
    return { valid: false, reason: "Estructura incompleta" };
  }

  // 1. Contraste temporal: debe ser estrictamente posterior al registro actual
  if (candidate.startDate <= latestLocal.startDate) {
    return {
      valid: false,
      reason: `Fecha no novedosa (${candidate.startDate} <= ${latestLocal.startDate}). El registro ya existe.`,
      isDuplicateOrOld: true,
    };
  }

  // 1b. Bloqueo de fechas futuras implausibles (ej. error de mes en CSV > 10 días adelante)
  if (referenceDate) {
    const todayIso = referenceDate.toISOString().slice(0, 10);
    if (diffDaysIso(todayIso, candidate.startDate) > 10) {
      return {
        valid: false,
        reason: `Fecha futura anómala (${candidate.startDate} > ${todayIso} + 10d). Posible error de mes en fuente.`,
      };
    }
  }

  // 2. Verificación de completitud de los 6 combustibles de consumo masivo
  const requiredFuels = [
    "gasolina-premium",
    "gasolina-regular",
    "gasoil-optimo",
    "gasoil-regular",
    "glp",
    "gas-natural",
  ];
  for (const f of requiredFuels) {
    const val = candidate.prices[f];
    if (typeof val !== "number" || isNaN(val) || val <= 0) {
      return { valid: false, reason: `Combustible ${f} no tiene un precio válido (> 0)` };
    }
  }

  // 3. Límites de cordura del mercado dominicano (Sanity Bounds)
  const prem = candidate.prices["gasolina-premium"];
  const reg = candidate.prices["gasolina-regular"];
  const glp = candidate.prices["glp"];

  if (prem < 150 || prem > 550) {
    return { valid: false, reason: `Gasolina Premium fuera de rango sensato (${prem})` };
  }
  if (reg < 140 || reg > 500) {
    return { valid: false, reason: `Gasolina Regular fuera de rango sensato (${reg})` };
  }
  if (glp < 50 || glp > 250) {
    return { valid: false, reason: `GLP fuera de rango sensato (${glp})` };
  }

  // 4. Contraste de variación porcentual semanal máxima (<= 15% por semana)
  for (const f of requiredFuels) {
    const oldPrice = latestLocal.prices[f];
    const newPrice = candidate.prices[f];
    if (oldPrice > 0) {
      const pctChange = Math.abs((newPrice - oldPrice) / oldPrice);
      if (pctChange > 0.15) {
        return {
          valid: false,
          reason: `Variación semanal anómala para ${f}: ${(pctChange * 100).toFixed(1)}% vs semana previa`,
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Consulta y sincroniza la cotización internacional del Crudo WTI (Texas)
 */
async function syncWtiBenchmark() {
  console.log("\n[WTI] Sincronizando cotización internacional del Crudo Texas (CL=F)...");

  for (const endpoint of WTI_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) continue;
      const data = await res.json();
      const result = data.chart?.result?.[0];
      if (!result) continue;

      const meta = result.meta;
      const rawQuotes = result.indicators?.quote?.[0]?.close || [];
      const quotes = rawQuotes.filter((v) => typeof v === "number" && !isNaN(v));
      const currentPrice = meta?.regularMarketPrice || quotes[quotes.length - 1];
      const prevPrice = meta?.chartPreviousClose || quotes[0] || currentPrice;

      if (!currentPrice || isNaN(currentPrice)) continue;

      const priceUsd = Math.round(currentPrice * 100) / 100;
      const changeUsd = Math.round((currentPrice - prevPrice) * 100) / 100;
      const percentageChange =
        prevPrice > 0 ? Math.round(((currentPrice - prevPrice) / prevPrice) * 10000) / 100 : 0;
      const trend = changeUsd > 0 ? "up" : changeUsd < 0 ? "down" : "unchanged";

      // Evitar commits vacíos fuera de horario de mercado si la cotización no cambió
      if (fs.existsSync(WTI_PATH)) {
        try {
          const existing = JSON.parse(fs.readFileSync(WTI_PATH, "utf-8"));
          if (
            existing.priceUsd === priceUsd &&
            existing.changeUsd === changeUsd &&
            existing.percentageChange === percentageChange
          ) {
            console.log(` -> WTI sin variación desde última lectura: US$ ${priceUsd.toFixed(2)}`);
            return true;
          }
        } catch {
          // Continuar y reescribir si el JSON previo estaba dañado
        }
      }

      const benchmark = {
        priceUsd,
        changeUsd,
        percentageChange,
        trend,
        label: "Crudo WTI • Texas (Ref. Internacional)",
        updatedAt: new Date().toISOString(),
      };

      fs.writeFileSync(WTI_PATH, JSON.stringify(benchmark, null, 2), "utf-8");
      console.log(
        ` -> WTI Actualizado: US$ ${benchmark.priceUsd.toFixed(2)} (${benchmark.changeUsd >= 0 ? "+" : ""}${benchmark.changeUsd.toFixed(2)} / ${benchmark.percentageChange}%)`
      );
      return true;
    } catch {
      continue;
    }
  }

  console.warn(" -> No se pudo actualizar WTI en vivo, manteniendo caché persistente.");
  return false;
}

async function main() {
  console.log("=========================================================");
  console.log("  subiólagasolina | Motor de Sincronización y Validación ");
  console.log("=========================================================");

  if (!fs.existsSync(HISTORY_PATH)) {
    throw new Error(`Archivo histórico no encontrado en ${HISTORY_PATH}`);
  }

  const historyRaw = fs.readFileSync(HISTORY_PATH, "utf-8");
  const history = JSON.parse(historyRaw);
  let latestLocal = history[history.length - 1];

  console.log(`[LOCAL] Última semana registrada: ${latestLocal.weekId} (${latestLocal.dateLabel})`);
  console.log(`[LOCAL] Tarifa Premium vigente: RD$ ${latestLocal.prices["gasolina-premium"].toFixed(2)}`);

  // Actualizar cotización internacional del Crudo WTI (Texas)
  await syncWtiBenchmark();

  console.log("\n[EXTRACCIÓN] Consultando fuentes oficiales en paralelo (Notas de Prensa + CSV)...");

  const [pressReleaseResult, csvResult] = await Promise.allSettled([
    fetchFromPressReleases(),
    fetchFromOfficialCsv(),
  ]);

  const pressRecords = pressReleaseResult.status === "fulfilled" ? pressReleaseResult.value : [];
  const csvRecords = csvResult.status === "fulfilled" ? csvResult.value : [];

  console.log(
    ` -> Notas de Prensa MICM: ${pressRecords.length} encontradas (${pressRecords.map((r) => r.weekId).join(", ") || "ninguna"})`
  );
  console.log(
    ` -> CSV Datos Abiertos: ${csvRecords.length > 0 ? `Última fila (${csvRecords[csvRecords.length - 1].weekId})` : "No disponible"}`
  );

  // Combinar candidatos nuevos (> latestLocal.startDate), priorizando Nota de Prensa sobre CSV
  const candidateMap = new Map();
  for (const r of csvRecords) {
    if (r.startDate > latestLocal.startDate) {
      candidateMap.set(r.startDate, r);
    }
  }
  for (const r of pressRecords) {
    if (r.startDate > latestLocal.startDate) {
      candidateMap.set(r.startDate, r);
    }
  }

  const newCandidates = [...candidateMap.values()].sort((a, b) =>
    a.startDate.localeCompare(b.startDate)
  );

  if (newCandidates.length === 0) {
    console.log("\n[AL DÍA] No se detectaron semanas nuevas posteriores a la última registrada.");
    console.log("NEW_WEEK_DETECTED=false");
    return;
  }

  const nowRef = new Date();
  let addedCount = 0;

  for (const candidate of newCandidates) {
    console.log(`\n[CONTRASTE] Evaluando candidato: ${candidate.weekId} (${candidate.startDate})...`);
    const validation = validateCandidateAgainstLocal(candidate, latestLocal, nowRef);

    if (!validation.valid) {
      if (validation.isDuplicateOrOld) {
        console.log(` -> [OMITIDO] ${validation.reason}`);
        continue;
      }
      console.error(` -> [RECHAZADO] Falló regla de integridad: ${validation.reason}`);
      if (addedCount === 0) {
        console.log("NEW_WEEK_DETECTED=false");
        process.exit(1);
      }
      continue;
    }

    history.push(candidate);
    latestLocal = candidate;
    addedCount++;

    console.log(`[APROBADO] ${candidate.dateLabel} (${candidate.weekId}) [${candidate.source}]`);
    console.log(
      ` -> Premium: RD$ ${candidate.prices["gasolina-premium"].toFixed(2)} | Regular: RD$ ${candidate.prices["gasolina-regular"].toFixed(2)} | GLP: RD$ ${candidate.prices["glp"].toFixed(2)}`
    );
  }

  if (addedCount > 0) {
    fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2), "utf-8");
    console.log(`\n[ÉXITO] Se incorporaron ${addedCount} semana(s) nuevas en ${HISTORY_PATH}.`);
    console.log("NEW_WEEK_DETECTED=true");
  } else {
    console.log("\n[AL DÍA] Ningún candidato nuevo superó el filtro temporal.");
    console.log("NEW_WEEK_DETECTED=false");
  }
}

const isMainModule =
  typeof process !== "undefined" &&
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMainModule) {
  main().catch((err) => {
    console.error("Error crítico en sincronización:", err);
    process.exit(1);
  });
}
