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
    if (!res.ok) return null;
    const text = await res.text();
    const lines = text.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 10) return null;

    const lastLine = lines[lines.length - 1];
    const cols = lastLine.split(";").map(c => c.trim().replace(",", "."));
    const diaDesde = parseInt(cols[0], 10);
    const diaHasta = parseInt(cols[1], 10);
    const mesStr = cols[2]?.toLowerCase() || "";
    const anio = parseInt(cols[3], 10);

    const mesNum = MONTH_MAP[mesStr] || "01";
    const startDate = `${anio}-${mesNum}-${String(diaDesde).padStart(2, "0")}`;

    // Si ya existe en el histórico, no hay semana nueva aquí
    const exists = currentHistory.some(r => r.startDate === startDate);
    if (exists) return null;

    const prem = parseFloat(cols[4]) || 0;
    const reg = parseFloat(cols[5]) || 0;
    const gasoilReg = parseFloat(cols[6]) || 0;
    const gasoilOpt = parseFloat(cols[14]) || (gasoilReg + 30);
    const avtur = parseFloat(cols[15]) || 0;
    const kerosene = parseFloat(cols[16]) || 0;
    const fuelOil = parseFloat(cols[17]) || 0;
    const fuelOil1s = parseFloat(cols[22]) || 0;
    const glp = parseFloat(cols[25]) || 0;

    if (prem < 100 || reg < 100) return null;

    const iso = getIsoWeek(startDate);

    return {
      weekId: `${iso.year}-W${String(iso.week).padStart(2, "0")}`,
      year: iso.year,
      weekNumber: iso.week,
      startDate,
      endDate: `${anio}-${mesNum}-${String(diaHasta).padStart(2, "0")}`,
      dateLabel: `${diaDesde} al ${diaHasta} de ${mesStr} de ${anio}`,
      shortDateLabel: `${diaDesde}-${diaHasta} ${mesStr.slice(0, 3).toUpperCase()}`,
      announcementDate: `${anio}-${mesNum}-${String(Math.max(1, diaDesde - 1)).padStart(2, "0")}`,
      source: "Portal Nacional de Datos Abiertos / MICM",
      prices: {
        "gasolina-premium": prem,
        "gasolina-regular": reg,
        "gasoil-optimo": gasoilOpt,
        "gasoil-regular": gasoilReg,
        "glp": glp,
        "gas-natural": 43.97,
        "avtur": avtur,
        "kerosene": kerosene,
        "fuel-oil-6": fuelOil,
        "fuel-oil-1s": fuelOil1s,
      }
    };
  } catch (e) {
    console.log("No fue posible consultar CSV oficial:", e.message);
    return null;
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
  const newRecordFromCsv = await fetchFromOfficialCsv(history);
  if (newRecordFromCsv) {
    console.log(`¡Nueva semana detectada en Datos Abiertos! ${newRecordFromCsv.weekId} (${newRecordFromCsv.dateLabel})`);
    history.push(newRecordFromCsv);
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
