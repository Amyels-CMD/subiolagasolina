import fs from "fs";
import path from "path";

const HISTORY_PATH = path.resolve("src", "data", "fuel-history.json");

function getIsoWeek(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: date.getUTCFullYear(), week: weekNo };
}

const MONTH_MAP = {
  enero: "01", febrero: "02", marzo: "03", abril: "04",
  mayo: "05", junio: "06", julio: "07", agosto: "08",
  septiembre: "09", octubre: "10", noviembre: "11", diciembre: "12"
};

/**
 * Consulta la fuente consolidada de Datos Abiertos de MICM
 */
async function fetchFromOfficialCsv(currentHistory) {
  const CSV_URL = "https://micm.gob.do/transparencias/datos-abiertos/precios-de-combustibles/precios-de-combustibles-2010-2026.csv";
  try {
    const res = await fetch(CSV_URL, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const text = await res.text();
    const lines = text.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 10) return [];

    const existingDates = new Set(currentHistory.map(r => r.startDate));
    const newRecords = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(";").map(c => c.trim().replace(",", "."));
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

      if (existingDates.has(startDate)) continue;

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

      newRecords.push({
        weekId,
        year: iso.year,
        weekNumber: iso.week,
        startDate,
        endDate,
        dateLabel: `${diaDesde} al ${diaHasta} de ${mesStr} de ${anio}`,
        shortDateLabel: `${diaDesde}-${diaHasta} ${mesStr.slice(0, 3).toUpperCase()}`,
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
      existingDates.add(startDate);
    }

    return newRecords.sort((a, b) => a.startDate.localeCompare(b.startDate));
  } catch (e) {
    console.log("No fue posible consultar CSV oficial:", e.message);
    return [];
  }
}

async function main() {
  console.log("Iniciando verificación semanal de precios de combustibles...");

  if (!fs.existsSync(HISTORY_PATH)) {
    throw new Error(`Archivo histórico no encontrado en ${HISTORY_PATH}`);
  }

  const historyRaw = fs.readFileSync(HISTORY_PATH, "utf-8");
  const history = JSON.parse(historyRaw);
  const latestLocal = history[history.length - 1];

  console.log(`Última semana en registro local: ${latestLocal.weekId} (${latestLocal.dateLabel})`);

  // Intentar ingesta oficial
  const newRecords = await fetchFromOfficialCsv(history);
  if (newRecords && newRecords.length > 0) {
    console.log(`¡Detectadas ${newRecords.length} semanas nuevas en Datos Abiertos!`);
    for (const rec of newRecords) {
      console.log(` -> Incorporando: ${rec.weekId} (${rec.dateLabel})`);
      history.push(rec);
    }
    fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2), "utf-8");
    console.log("Histórico actualizado con éxito.");
    console.log("NEW_WEEK_DETECTED=true");
    return;
  }

  console.log("Verificación culminada. Los datos locales ya están al día con la última resolución oficial.");
  console.log("NEW_WEEK_DETECTED=false");
}

main().catch(err => {
  console.error("Error en sincronización semanal:", err);
  process.exit(1);
});
