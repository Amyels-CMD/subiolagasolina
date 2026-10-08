"use client";

import React, { useState, useMemo } from "react";
import { History, Search, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { WeeklyFuelRecord } from "@/lib/types/fuel";
import { downloadExcel, downloadCsv } from "@/lib/utils/export-dataset";

interface HistoricalTableProps {
  history: WeeklyFuelRecord[];
}

export function HistoricalTable({ history }: HistoricalTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(12);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Filter chronologically descending
  const reversed = useMemo(() => [...history].reverse(), [history]);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return reversed;
    const term = searchTerm.toLowerCase();
    return reversed.filter(
      (r) =>
        r.dateLabel.toLowerCase().includes(term) ||
        r.year.toString().includes(term) ||
        r.weekId.toLowerCase().includes(term)
    );
  }, [reversed, searchTerm]);

  const displayed = filtered.slice(0, visibleCount);

  const handleDownloadExcel = async () => {
    setIsExportingExcel(true);
    try {
      await downloadExcel(history);
    } catch (err) {
      console.error("Error al exportar a Excel:", err);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleDownloadCsv = () => {
    downloadCsv(history);
  };

  return (
    <section id="historico" className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="py-6 border-b border-white/10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
              <History className="w-4 h-4" />
              <span>Registro Semanal Oficial</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Historial de Resoluciones
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por fecha..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors w-36 sm:w-44"
              />
            </div>

            {/* Export for Excel (.xlsx) and CSV */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleDownloadExcel}
                disabled={isExportingExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
                title="Descargar libro de Microsoft Excel (.xlsx) con columnas y anchos formateados"
              >
                {isExportingExcel ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                ) : (
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>Descargar Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadCsv}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 text-xs font-semibold transition-all cursor-pointer"
                title="Descargar archivo CSV delimitado con UTF-8 BOM para Excel"
              >
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0">
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-3">Período Oficial</th>
                <th className="py-3 px-3">Premium</th>
                <th className="py-3 px-3">Regular</th>
                <th className="py-3 px-3">Gasoil Ópt.</th>
                <th className="py-3 px-3 hidden sm:table-cell">Gasoil Reg.</th>
                <th className="py-3 px-3">GLP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {displayed.map((rec) => (
                <tr key={`${rec.weekId}-${rec.startDate}`} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-3 font-sans text-slate-200 font-medium">
                    {rec.dateLabel}
                  </td>
                  <td className="py-3 px-3 text-white font-semibold">
                    RD$ {rec.prices["gasolina-premium"]?.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    RD$ {rec.prices["gasolina-regular"]?.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    RD$ {rec.prices["gasoil-optimo"]?.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 hidden sm:table-cell text-slate-300">
                    RD$ {rec.prices["gasoil-regular"]?.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    RD$ {rec.prices["glp"]?.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Load More Button */}
        {visibleCount < filtered.length && (
          <div className="text-center mt-6 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 12)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 border border-white/10 transition-all"
            >
              Cargar más semanas ({filtered.length - visibleCount} restantes)
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
