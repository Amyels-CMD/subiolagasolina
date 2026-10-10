import fs from "fs";
import path from "path";

const HISTORY_PATH = path.resolve("src", "data", "fuel-history.json");
const WTI_PATH = path.resolve("src", "data", "wti-benchmark.json");
const CSV_URL =
  "https://micm.gob.do/transparencias/datos-abiertos/precios-de-combustibles/precios-de-combustibles-2010-2026.csv";
const NOTICIAS_URL = "https://micm.gob.do/noticias/";

const MONTH_MAP = {
  enero: "01", febrero: "02", marzo: "03", abril: "04",
  mayo: "05", junio: "06", julio: "07", agosto: "08",
  septiembre: "09", octubre: "10", noviembre: "11", diciembre: "12"
};

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

function getIsoWeek(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: date.getUTCFullYear(), week: weekNo };
}

/**
 * Fuente 1 (Primaria): Scraper de la nota de prensa oficial del MICM.
 * Se publica de inmediato cada viernes a la 1:00 PM AST en micm.gob.do/noticias/
 */
async function fetchFromPressRelease() {
  try {
    const res = await fetch(NOTICIAS_URL, {
      signal: AbortSignal.timeout(12000),
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) subiolagasolina-bot/1.0" },
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
      signal: AbortSignal.timeout(12000),
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) subiolagasolina-bot/1.0" },
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

    function extractPrice(regex) {
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
  } catch (err) {
    console.log("Nota de prensa no disponible en este momento:", err.message);
    return null;
  }
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
    const lines = text.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 10) return [];

    const records = [];
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
      const padDiaDesde = String(diaDesde).padStart(2, "0");
      const padDiaHasta = String(diaHasta).padStart(2, "0");
      const startDate = `${anio}-${mesNum}-${padDiaDesde}`;

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

      records.push({
        weekId,
        year: iso.year,
        weekNumber: iso.week,
        startDate,
        endDate,
        dateLabel: `${diaDesde} al ${diaHasta} de ${mesStr} de ${anio}`,
        shortDateLabel: `${diaDesde}-${diaHasta} ${mesStr.slice(0, 3).toUpperCase()}`,
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

    return records.sort((a, b) => a.startDate.localeCompare(b.startDate));
  } catch (err) {
    console.log("CSV oficial no disponible en este momento:", err.message);
    return [];
  }
}

/**
 * Motor de Validación Cruzada y Contraste contra el Registro Actual
 */
function validateCandidateAgainstLocal(candidate, latestLocal) {
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
  try {
    console.log("\n[WTI] Sincronizando cotización internacional del Crudo Texas (CL=F)...");
    const res = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/CL=F?interval=1d&range=5d",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const result = data.chart?.result?.[0];
    if (!result) throw new Error("Sin respuesta de mercado");

    const meta = result.meta;
    const rawQuotes = result.indicators?.quote?.[0]?.close || [];
    const quotes = rawQuotes.filter((v) => typeof v === "number" && !isNaN(v));
    const currentPrice = meta?.regularMarketPrice || quotes[quotes.length - 1];
    const prevPrice = meta?.chartPreviousClose || quotes[0] || currentPrice;

    if (!currentPrice || isNaN(currentPrice)) throw new Error("Precio WTI inválido");

    const changeUsd = Math.round((currentPrice - prevPrice) * 100) / 100;
    const percentageChange =
      prevPrice > 0 ? Math.round(((currentPrice - prevPrice) / prevPrice) * 10000) / 100 : 0;
    const trend = changeUsd > 0 ? "up" : changeUsd < 0 ? "down" : "unchanged";

    const benchmark = {
      priceUsd: Math.round(currentPrice * 100) / 100,
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
  } catch (err) {
    console.warn(" -> No se pudo actualizar WTI en vivo, manteniendo caché persistente:", err.message);
    return false;
  }
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
  const latestLocal = history[history.length - 1];

  console.log(`[LOCAL] Última semana registrada: ${latestLocal.weekId} (${latestLocal.dateLabel})`);
  console.log(`[LOCAL] Tarifa Premium vigente: RD$ ${latestLocal.prices["gasolina-premium"].toFixed(2)}`);

  // Actualizar cotización internacional del Crudo WTI (Texas)
  await syncWtiBenchmark();

  console.log("\n[EXTRACCIÓN] Consultando fuentes oficiales en paralelo (Nota de Prensa + CSV)...");

  // Consulta simultánea
  const [pressReleaseResult, csvResult] = await Promise.allSettled([
    fetchFromPressRelease(),
    fetchFromOfficialCsv(),
  ]);

  const pressRecord = pressReleaseResult.status === "fulfilled" ? pressReleaseResult.value : null;
  const csvRecords = csvResult.status === "fulfilled" ? csvResult.value : [];
  const latestCsvRecord = csvRecords.length > 0 ? csvRecords[csvRecords.length - 1] : null;

  console.log(` -> Nota de Prensa MICM: ${pressRecord ? `Encontrada (${pressRecord.weekId})` : "No disponible"}`);
  console.log(` -> CSV Datos Abiertos: ${latestCsvRecord ? `Última fila (${latestCsvRecord.weekId})` : "No disponible"}`);

  // Selección de candidato con consenso
  let candidate = null;
  let validationNote = "";

  if (pressRecord && latestCsvRecord && pressRecord.startDate === latestCsvRecord.startDate) {
    // Ambas fuentes coinciden en la fecha
    console.log("\n[CONSENSO] Ambas fuentes reportan la misma semana. Verificando consistencia cruzada...");
    const mismatch = Object.keys(pressRecord.prices).find(
      (k) => Math.abs(pressRecord.prices[k] - latestCsvRecord.prices[k]) > 0.05
    );
    if (!mismatch) {
      candidate = pressRecord;
      validationNote = "Consenso total: 100% de coincidencia entre Nota de Prensa y CSV Datos Abiertos.";
    } else {
      console.log(`Discrepancia detectada en ${mismatch}. Dando prioridad a Nota de Prensa oficial.`);
      candidate = pressRecord;
      validationNote = "Validado prioritariamente vía Nota de Prensa oficial firmada por MICM.";
    }
  } else if (pressRecord) {
    candidate = pressRecord;
    validationNote = "Ingesta inmediata vía Nota de Prensa oficial del MICM (CSV aún pendiente de actualización).";
  } else if (latestCsvRecord) {
    candidate = latestCsvRecord;
    validationNote = "Ingesta vía CSV de Datos Abiertos oficial.";
  }

  if (!candidate) {
    console.log("\n[STATUS] Ninguna fuente arrojó datos legibles en este intento.");
    console.log("NEW_WEEK_DETECTED=false");
    return;
  }

  // Contraste estricto contra la base de datos actual
  console.log(`\n[CONTRASTE] Evaluando candidato: ${candidate.weekId} (${candidate.startDate})...`);
  const validation = validateCandidateAgainstLocal(candidate, latestLocal);

  if (!validation.valid) {
    if (validation.isDuplicateOrOld) {
      console.log(` -> [AL DÍA] ${validation.reason}`);
      console.log("NEW_WEEK_DETECTED=false");
      return;
    }
    console.error(` -> [RECHAZADO] Falló regla de integridad: ${validation.reason}`);
    console.log("NEW_WEEK_DETECTED=false");
    process.exit(1);
  }

  // Si pasó todas las pruebas: incorporar al histórico
  console.log(`\n[APROBADO] Candidato superó todas las validaciones de cordura y contraste.`);
  console.log(` -> Detalle: ${validationNote}`);
  console.log(` -> Período nuevo: ${candidate.dateLabel} (${candidate.weekId})`);
  console.log(` -> Gasolina Premium: RD$ ${candidate.prices["gasolina-premium"].toFixed(2)}`);
  console.log(` -> Gasolina Regular: RD$ ${candidate.prices["gasolina-regular"].toFixed(2)}`);
  console.log(` -> GLP: RD$ ${candidate.prices["glp"].toFixed(2)}`);

  history.push(candidate);
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2), "utf-8");

  console.log(`\n[ÉXITO] Archivo ${HISTORY_PATH} actualizado y persistido.`);
  console.log("NEW_WEEK_DETECTED=true");
}

main().catch((err) => {
  console.error("Error crítico en sincronización:", err);
  process.exit(1);
});
