import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parsePeriodFromText,
  parsePressReleaseHtml,
  extractCandidateNewsUrls,
  parseOfficialCsvText,
  validateCandidateAgainstLocal,
  subtractDaysIso,
} from "../../scripts/weekly-sync.mjs";

describe("Weekly Sync Scraper and CSV Disambiguation Tests", () => {
  it("should subtract calendar days across month and year boundaries in UTC", () => {
    assert.strictEqual(subtractDaysIso("2026-10-31", 1), "2026-10-30");
    assert.strictEqual(subtractDaysIso("2026-11-01", 1), "2026-10-31");
    assert.strictEqual(subtractDaysIso("2026-01-01", 1), "2025-12-31");
  });

  it("should parse period even when MICM omits 'de' before the year (W43 bug)", () => {
    const res = parsePeriodFromText(
      "Para la semana del 24 al 30 de octubre 2026, el Ministerio de Industria dispone:"
    );
    assert.ok(res);
    assert.strictEqual(res.startDate, "2026-10-24");
    assert.strictEqual(res.endDate, "2026-10-30");
    assert.strictEqual(res.announcementDate, "2026-10-23");
    assert.strictEqual(res.dateLabel, "24 al 30 de octubre de 2026");
  });

  it("should parse cross-month period with accurate previous-month announcementDate (W44 bug)", () => {
    const res = parsePeriodFromText(
      "Para la semana del 31 de octubre al 6 de noviembre de 2026, el MICM dispone:"
    );
    assert.ok(res);
    assert.strictEqual(res.startDate, "2026-10-31");
    assert.strictEqual(res.endDate, "2026-11-06");
    assert.strictEqual(res.announcementDate, "2026-10-30");
    assert.strictEqual(res.dateLabel, "31 de octubre al 6 de noviembre de 2026");
    assert.strictEqual(res.shortDateLabel, "31 OCT - 6 NOV");
  });

  it("should parse cross-year period even when start year is omitted", () => {
    const res = parsePeriodFromText(
      "Para la semana del 27 de diciembre al 2 de enero de 2026, el MICM dispone:"
    );
    assert.ok(res);
    assert.strictEqual(res.startDate, "2025-12-27");
    assert.strictEqual(res.endDate, "2026-01-02");
    assert.strictEqual(res.announcementDate, "2025-12-26");
    assert.strictEqual(res.dateLabel, "27 de diciembre de 2025 al 2 de enero de 2026");
  });

  it("should parse real MICM press release HTML with HTML entities and return null for non-table news", () => {
    const validHtml = `
      <article>
        <p>Para la semana del 24 al 30 de octubre 2026, el Ministerio de Industria, Comercio y MiPymes
        dispone que los combustibles se comercialicen a los siguientes precios:</p>
        <p>Gasolina Premium se vender&aacute; a RD$358.10 por gal&oacute;n mantiene su precio.
        Gasolina Regular RD$317.50 por gal&oacute;n mantiene su precio.
        Gasoil Regular RD$270.80 por gal&oacute;n.
        Gasoil &Oacute;ptimo RD$318.10 por gal&oacute;n.
        Avtur RD$358.66. Kerosene RD$402.70.
        Fuel O&iacute;l #6 RD$195.87. Fuel O&iacute;l 1%S RD$232.64.
        Gas Licuado de Petr&oacute;leo (GLP) RD$135.20.
        Gas Natural RD$43.97 por m3.</p>
      </article>
    `;
    const record = parsePressReleaseHtml(
      validHtml,
      "https://micm.gob.do/gobierno-congela-combustibles-8/"
    );
    assert.ok(record);
    assert.strictEqual(record.weekId, "2026-W43");
    assert.strictEqual(record.startDate, "2026-10-24");
    assert.strictEqual(record.prices["gasolina-premium"], 358.1);
    assert.strictEqual(record.prices["gasoil-optimo"], 318.1);
    assert.strictEqual(record.prices["fuel-oil-6"], 195.87);

    const editorialHtml = `<article><p>El gobierno y economistas analizaron el impacto de los precios de los combustibles.</p></article>`;
    const nonRecord = parsePressReleaseHtml(
      editorialHtml,
      "https://micm.gob.do/gobierno-empresariado-y-economistas-analizan-el-impacto-de-los-precios-de-los-combustibles/"
    );
    assert.strictEqual(nonRecord, null);
  });

  it("should collect all candidate fuel article URLs without stopping at an editorial post", () => {
    const html = `
      <a href="https://micm.gob.do/categoria/combustibles/">Categoria</a>
      <a href="https://micm.gob.do/gobierno-reajusta-combustibles-premium/"></a>
      <a href="https://micm.gob.do/gobierno-empresariado-y-economistas-analizan-el-impacto-de-los-precios-de-los-combustibles/"></a>
      <a href="https://micm.gob.do/gobierno-congela-combustibles-9/"></a>
      <a href="https://micm.gob.do/gobierno-congela-combustibles-9/">Duplicate</a>
    `;
    const urls = extractCandidateNewsUrls(html, 10);
    assert.strictEqual(urls.length, 3);
    assert.strictEqual(urls[0], "https://micm.gob.do/gobierno-reajusta-combustibles-premium/");
    assert.strictEqual(urls[2], "https://micm.gob.do/gobierno-congela-combustibles-9/");
  });

  it("should disambiguate MICM CSV cross-month rows when end month is written in MES column", () => {
    const csvSample = [
      "DIA DESDE;DIA HASTA;MES;ANO;P;R;GR;A;B;C;D;E;F;G;GO;AV;KE;FO;H;I;J;K;FO1;L;M;GLP",
      "22;28;Agosto;2026;341;310;262;0;0;0;0;0;0;0;293;297;336;165;0;0;0;0;193;0;0;135",
      "29;4;Septiembre;2026;341;310;262;0;0;0;0;0;0;0;293;291;329;166;0;0;0;0;195;0;0;135",
      "19;25;Septiembre;2026;350;315;267;0;0;0;0;0;0;0;302;345;388;178;0;0;0;0;214;0;0;135",
      "25;2;Octubre;2026;353;317;270;0;0;0;0;0;0;0;306;336;383;176;0;0;0;0;210;0;0;135",
    ].join("\n");

    const parsed = parseOfficialCsvText(csvSample);
    assert.strictEqual(parsed.length, 4);

    assert.strictEqual(parsed[1].startDate, "2026-08-29");
    assert.strictEqual(parsed[1].endDate, "2026-09-04");
    assert.strictEqual(parsed[1].dateLabel, "29 de agosto al 4 de septiembre de 2026");

    // Crucial check: "25;2;Octubre;2026" after Sept 25 MUST NOT jump to 2026-10-25
    assert.strictEqual(parsed[3].startDate, "2026-09-25");
    assert.strictEqual(parsed[3].endDate, "2026-10-02");
    assert.strictEqual(parsed[3].announcementDate, "2026-09-24");
  });

  it("should reject implausible future dates and accept valid sequential candidates", () => {
    const latest = {
      startDate: "2026-10-10",
      prices: {
        "gasolina-premium": 358.1,
        "gasolina-regular": 317.5,
        "gasoil-optimo": 318.1,
        "gasoil-regular": 270.8,
        glp: 135.2,
        "gas-natural": 43.97,
      },
    };

    const validNext = {
      startDate: "2026-10-17",
      prices: { ...latest.prices },
    };

    const refDate = new Date("2026-10-16T18:00:00Z");
    assert.strictEqual(validateCandidateAgainstLocal(validNext, latest, refDate).valid, true);

    const bogusFuture = {
      startDate: "2026-11-25",
      prices: { ...latest.prices },
    };
    assert.strictEqual(validateCandidateAgainstLocal(bogusFuture, latest, refDate).valid, false);
  });
});

