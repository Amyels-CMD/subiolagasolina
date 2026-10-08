import { WeeklyFuelRecord } from "@/lib/types/fuel";

/**
 * Generates and downloads a native Microsoft Excel (.xlsx) file with
 * auto-adjusted column widths and clean numeric formatting.
 */
export async function downloadExcel(history: WeeklyFuelRecord[]): Promise<void> {
  const XLSX = await import("xlsx");

  const rows = history.map((r) => ({
    "Semana ID": r.weekId,
    "Fecha Inicio": r.startDate,
    "Fecha Fin": r.endDate,
    "Período Oficial": r.dateLabel,
    "Gasolina Premium (DOP)": r.prices["gasolina-premium"] ?? null,
    "Gasolina Regular (DOP)": r.prices["gasolina-regular"] ?? null,
    "Gasoil Óptimo (DOP)": r.prices["gasoil-optimo"] ?? null,
    "Gasoil Regular (DOP)": r.prices["gasoil-regular"] ?? null,
    "Kerosene (DOP)": r.prices["kerosene"] ?? null,
    "Fuel Oil #6 (DOP)": r.prices["fuel-oil-6"] ?? null,
    "Avtur (DOP)": r.prices["avtur"] ?? null,
    "GLP (DOP)": r.prices["glp"] ?? null,
    "Gas Natural (DOP)": r.prices["gas-natural"] ?? null,
    "Fuente Reguladora": "MICM • Ley 112-00 (subiólagasolina.com)",
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  // Auto-fit column widths so no headers or values are clipped
  const headers = Object.keys(rows[0] || {});
  ws["!cols"] = headers.map((key) => {
    let maxLen = key.length;
    for (let i = 0; i < Math.min(rows.length, 60); i++) {
      const val = String((rows[i] as Record<string, unknown>)[key] ?? "");
      if (val.length > maxLen) maxLen = val.length;
    }
    return { wch: Math.max(maxLen + 3, 14) };
  });

  XLSX.utils.book_append_sheet(wb, ws, "Histórico Precios RD");

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `combustibles-rd-historico-${dateStr}.xlsx`);
}

/**
 * Generates and downloads a properly encoded CSV file with UTF-8 BOM
 * and Excel delimiter hint (sep=;) so it opens natively into columns in Excel
 * without character corruption (Período, Óptimo).
 */
export function downloadCsv(history: WeeklyFuelRecord[]): void {
  const headers = [
    "Semana ID",
    "Fecha Inicio",
    "Fecha Fin",
    "Período Oficial",
    "Gasolina Premium (DOP)",
    "Gasolina Regular (DOP)",
    "Gasoil Óptimo (DOP)",
    "Gasoil Regular (DOP)",
    "Kerosene (DOP)",
    "Fuel Oil #6 (DOP)",
    "Avtur (DOP)",
    "GLP (DOP)",
    "Gas Natural (DOP)",
    "Fuente Reguladora",
  ];

  const rows = history.map((r) => [
    r.weekId,
    r.startDate,
    r.endDate,
    `"${r.dateLabel.replace(/"/g, '""')}"`,
    r.prices["gasolina-premium"] ?? "",
    r.prices["gasolina-regular"] ?? "",
    r.prices["gasoil-optimo"] ?? "",
    r.prices["gasoil-regular"] ?? "",
    r.prices["kerosene"] ?? "",
    r.prices["fuel-oil-6"] ?? "",
    r.prices["avtur"] ?? "",
    r.prices["glp"] ?? "",
    r.prices["gas-natural"] ?? "",
    `"MICM • Ley 112-00 (subiólagasolina.com)"`,
  ]);

  // \uFEFF is UTF-8 BOM so Excel opens accented characters like 'í' and 'Ó' without mojibake.
  // sep=; tells Excel to use semicolon as the delimiter so it separates directly into columns.
  const csvContent =
    "\uFEFFsep=;\r\n" +
    headers.join(";") +
    "\r\n" +
    rows.map((row) => row.join(";")).join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute("href", url);
  link.setAttribute("download", `combustibles-rd-historico-${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
