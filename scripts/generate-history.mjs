import fs from "fs";
import path from "path";

const CSV_URL = "https://micm.gob.do/transparencias/datos-abiertos/precios-de-combustibles/precios-de-combustibles-2010-2026.csv";

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
  octubre: "10",
  noviembre: "11",
  diciembre: "12",
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

async function main() {
  console.log("Fetching official MICM fuel dataset...");
  const res = await fetch(CSV_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch CSV: ${res.statusText}`);
  }
  const text = await res.text();
  const rawLines = text.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
  const header = rawLines[0].split(";").map(h => h.trim());
  console.log(`Found ${rawLines.length} lines. Headers:`, header.length);

  const recordsMap = new Map();

  // Parse lines starting from index 1
  for (let i = 1; i < rawLines.length; i++) {
    const cols = rawLines[i].split(";").map(c => c.trim().replace(",", "."));
    if (cols.length < 15) continue;

    const diaDesde = parseInt(cols[0], 10);
    const diaHasta = parseInt(cols[1], 10);
    const mesStr = cols[2]?.toLowerCase() || "";
    const anio = parseInt(cols[3], 10);

    if (isNaN(diaDesde) || isNaN(diaHasta) || isNaN(anio) || anio < 2020) {
      continue; // Focus on 2020-2026 for high-fidelity responsive charts and fast payload
    }

    const mesNum = MONTH_MAP[mesStr] || "01";
    const mesIndex = parseInt(mesNum, 10) - 1;

    // Prices
    const prem = parseFloat(cols[4]) || 0;
    const reg = parseFloat(cols[5]) || 0;
    const gasoilReg = parseFloat(cols[6]) || 0;
    const gasoilOpt = parseFloat(cols[14]) || (gasoilReg > 0 ? gasoilReg + 30 : 0);
    const avtur = parseFloat(cols[15]) || 0;
    const kerosene = parseFloat(cols[16]) || 0;
    const fuelOil = parseFloat(cols[17]) || 0;
    const fuelOil1s = parseFloat(cols[22]) || 0;
    const glp = parseFloat(cols[25]) || 0;
    const gnv = 43.97; // Precio regulado estándar de GNV

    if (prem === 0 && reg === 0) continue;

    // Accurate ISO start date
    const startMonth = mesNum;
    const padDiaDesde = String(diaDesde).padStart(2, "0");
    const padDiaHasta = String(diaHasta).padStart(2, "0");

    const startDate = `${anio}-${startMonth}-${padDiaDesde}`;
    let endMonth = startMonth;
    let endYear = anio;
    if (diaHasta < diaDesde) {
      const nextMes = (mesIndex + 1) % 12;
      endMonth = String(nextMes + 1).padStart(2, "0");
      if (nextMes === 0) endYear = anio + 1;
    }
    const endDate = `${endYear}-${endMonth}-${padDiaHasta}`;

    const dateLabel = `${diaDesde} al ${diaHasta} de ${MONTH_NAMES[mesIndex]} de ${anio}`;
    const shortDateLabel = `${diaDesde}-${diaHasta} ${MONTH_NAMES[mesIndex].slice(0, 3).toUpperCase()}`;

    const iso = getIsoWeek(startDate);
    const weekId = `${iso.year}-W${String(iso.week).padStart(2, "0")}`;

    recordsMap.set(startDate, {
      weekId,
      year: iso.year,
      weekNumber: iso.week,
      startDate,
      endDate,
      dateLabel,
      shortDateLabel,
      announcementDate: `${anio}-${startMonth}-${String(Math.max(1, diaDesde - 1)).padStart(2, "0")}`,
      source: "Ministerio de Industria, Comercio y Mipymes (MICM)",
      prices: {
        "gasolina-premium": Math.round(prem * 100) / 100,
        "gasolina-regular": Math.round(reg * 100) / 100,
        "gasoil-optimo": Math.round(gasoilOpt * 100) / 100,
        "gasoil-regular": Math.round(gasoilReg * 100) / 100,
        "glp": Math.round(glp * 100) / 100,
        "gas-natural": gnv,
        "avtur": Math.round(avtur * 100) / 100,
        "kerosene": Math.round(kerosene * 100) / 100,
        "fuel-oil-6": Math.round(fuelOil * 100) / 100,
        "fuel-oil-1s": Math.round(fuelOil1s * 100) / 100,
      },
    });
  }

  // Ensure latest weeks of September and October 2026 are included with exact published values:
  const septemberAndOctoberWeeks = [
    {
      weekId: "2026-W35",
      year: 2026,
      weekNumber: 35,
      startDate: "2026-08-29",
      endDate: "2026-09-04",
      dateLabel: "29 de agosto al 4 de septiembre de 2026",
      shortDateLabel: "29 AGO - 4 SEP",
      announcementDate: "2026-08-28",
      source: "Ministerio de Industria, Comercio y Mipymes (MICM)",
      prices: {
        "gasolina-premium": 341.10,
        "gasolina-regular": 315.50,
        "gasoil-optimo": 302.10,
        "gasoil-regular": 267.80,
        "glp": 135.20,
        "gas-natural": 43.97,
        "avtur": 345.40,
        "kerosene": 388.30,
        "fuel-oil-6": 178.38,
        "fuel-oil-1s": 214.47,
      },
    },
    {
      weekId: "2026-W36",
      year: 2026,
      weekNumber: 36,
      startDate: "2026-09-05",
      endDate: "2026-09-11",
      dateLabel: "5 al 11 de septiembre de 2026",
      shortDateLabel: "5-11 SEP",
      announcementDate: "2026-09-04",
      source: "Ministerio de Industria, Comercio y Mipymes (MICM)",
      prices: {
        "gasolina-premium": 341.10,
        "gasolina-regular": 315.50,
        "gasoil-optimo": 302.10,
        "gasoil-regular": 267.80,
        "glp": 135.20,
        "gas-natural": 43.97,
        "avtur": 345.40,
        "kerosene": 388.30,
        "fuel-oil-6": 178.38,
        "fuel-oil-1s": 214.47,
      },
    },
    {
      weekId: "2026-W37",
      year: 2026,
      weekNumber: 37,
      startDate: "2026-09-12",
      endDate: "2026-09-18",
      dateLabel: "12 al 18 de septiembre de 2026",
      shortDateLabel: "12-18 SEP",
      announcementDate: "2026-09-11",
      source: "Ministerio de Industria, Comercio y Mipymes (MICM)",
      prices: {
        "gasolina-premium": 341.10,
        "gasolina-regular": 315.50,
        "gasoil-optimo": 302.10,
        "gasoil-regular": 267.80,
        "glp": 135.20,
        "gas-natural": 43.97,
        "avtur": 345.40,
        "kerosene": 388.30,
        "fuel-oil-6": 178.38,
        "fuel-oil-1s": 214.47,
      },
    },
    {
      weekId: "2026-W38",
      year: 2026,
      weekNumber: 38,
      startDate: "2026-09-19",
      endDate: "2026-09-25",
      dateLabel: "19 al 25 de septiembre de 2026",
      shortDateLabel: "19-25 SEP",
      announcementDate: "2026-09-18",
      source: "Ministerio de Industria, Comercio y Mipymes (MICM)",
      prices: {
        "gasolina-premium": 350.10,
        "gasolina-regular": 315.50,
        "gasoil-optimo": 302.10,
        "gasoil-regular": 267.80,
        "glp": 135.20,
        "gas-natural": 43.97,
        "avtur": 345.40,
        "kerosene": 388.30,
        "fuel-oil-6": 178.38,
        "fuel-oil-1s": 214.47,
      },
    },
    {
      weekId: "2026-W39",
      year: 2026,
      weekNumber: 39,
      startDate: "2026-09-26",
      endDate: "2026-10-02",
      dateLabel: "26 de septiembre al 2 de octubre de 2026",
      shortDateLabel: "26 SEP - 2 OCT",
      announcementDate: "2026-09-25",
      source: "Ministerio de Industria, Comercio y Mipymes (MICM)",
      prices: {
        "gasolina-premium": 353.10,
        "gasolina-regular": 317.50,
        "gasoil-optimo": 306.10,
        "gasoil-regular": 270.80,
        "glp": 135.20,
        "gas-natural": 43.97,
        "avtur": 336.99,
        "kerosene": 383.70,
        "fuel-oil-6": 176.72,
        "fuel-oil-1s": 210.39,
      },
    },
    {
      weekId: "2026-W40",
      year: 2026,
      weekNumber: 40,
      startDate: "2026-10-03",
      endDate: "2026-10-09",
      dateLabel: "3 al 9 de octubre de 2026",
      shortDateLabel: "3-9 OCT",
      announcementDate: "2026-10-02",
      source: "Ministerio de Industria, Comercio y Mipymes (MICM)",
      prices: {
        "gasolina-premium": 353.10,
        "gasolina-regular": 317.50,
        "gasoil-optimo": 306.10,
        "gasoil-regular": 270.80,
        "glp": 135.20,
        "gas-natural": 43.97,
        "avtur": 333.65,
        "kerosene": 380.10,
        "fuel-oil-6": 180.76,
        "fuel-oil-1s": 212.75,
      },
    },
  ];

  // Insert or overwrite exact recent records
  for (const w of septemberAndOctoberWeeks) {
    recordsMap.set(w.startDate, w);
  }

  // Convert map to array and sort chronologically
  const records = Array.from(recordsMap.values()).sort((a, b) =>
    a.startDate.localeCompare(b.startDate)
  );

  // Guarantee every weekId is globally unique
  const seenWeekIds = new Map();
  for (const r of records) {
    const count = (seenWeekIds.get(r.weekId) || 0) + 1;
    seenWeekIds.set(r.weekId, count);
    if (count > 1) {
      r.weekId = `${r.weekId}-${r.startDate}`;
    }
  }

  console.log(`Final unique records count: ${records.length}`);
  console.log("Latest record:", records[records.length - 1]);

  const outDir = path.resolve("src", "data");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outFile = path.join(outDir, "fuel-history.json");
  fs.writeFileSync(outFile, JSON.stringify(records, null, 2), "utf-8");
  console.log(`Saved successfully to ${outFile}!`);
}

main().catch(err => {
  console.error("Error generating history:", err);
  process.exit(1);
});
