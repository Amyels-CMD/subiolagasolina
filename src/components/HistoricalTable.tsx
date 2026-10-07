"use client";

import React, { useState, useMemo } from "react";
import { History, Search, Download, ChevronRight } from "lucide-react";
import { WeeklyFuelRecord } from "@/lib/types/fuel";
import { formatCurrency, formatMillions } from "@/lib/utils/format";

interface HistoricalTableProps {
  history: WeeklyFuelRecord[];
}

export function HistoricalTable({ history }: HistoricalTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(12);

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

  // CSV Exporter
  const handleDownloadCsv = () => {
    const headers = [
      "Semana ID",
      "Fecha Inicio",
      "Fecha Fin",
      "Período",
      "Gasolina Premium (DOP)",
      "Gasolina Regular (DOP)",
      "Gasoil Óptimo (DOP)",
      "Gasoil Regular (DOP)",
      "GLP (DOP)",
      "Gas Natural (DOP)",
      "Subsidio Millones (DOP)",
    ];

    const rows = history.map((r) => [
      r.weekId,
      r.startDate,
      r.endDate,
      `"${r.dateLabel}"`,
      r.prices["gasolina-premium"],
      r.prices["gasolina-regular"],
      r.prices["gasoil-optimo"],
      r.prices["gasoil-regular"],
      r.prices["glp"],
      r.prices["gas-natural"],
      r.subsidyMillionDop ?? "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `combustibles-rd-historico-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section id="historico" className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="data-card p-5 sm:p-7">
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

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por fecha..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors w-40 sm:w-48"
              />
            </div>

            {/* CSV Export */}
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-white/10 transition-colors"
              title="Descargar dataset histórico en CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Descargar CSV</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-3">Período Oficial</th>
                <th className="py-3 px-3">Premium</th>
                <th className="py-3 px-3">Regular</th>
                <th className="py-3 px-3">Gasoil Ópt.</th>
                <th className="py-3 px-3">GLP</th>
                <th className="py-3 px-3 hidden md:table-cell">Subsidio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {displayed.map((rec) => (
                <tr key={rec.weekId} className="hover:bg-white/[0.02] transition-colors">
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
                  <td className="py-3 px-3 text-slate-300">
                    RD$ {rec.prices["glp"]?.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 hidden md:table-cell font-sans text-slate-400">
                    {rec.subsidyMillionDop
                      ? `RD$ ${rec.subsidyMillionDop}M`
                      : "Regulado"}
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
