import React from "react";
import { WeeklySummary } from "@/lib/types/fuel";
import { formatCurrency, formatDelta } from "@/lib/utils/format";
import { Zap, ShieldCheck, Calendar, Clock, Database } from "lucide-react";

interface QuickFactsSummaryProps {
  summary: WeeklySummary;
}

export function QuickFactsSummary({ summary }: QuickFactsSummaryProps) {
  const { currentWeek, headlineVerdict, subVerdict, consumerItems, nextUpdateDate } = summary;

  return (
    <section
      id="resumen-rapido"
      aria-label="Ficha Técnica y Resumen Semanal para Conductores e Inteligencia Artificial"
      className="max-w-4xl mx-auto px-4 sm:px-6 my-6"
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-white/10 p-5 sm:p-6 shadow-2xl backdrop-blur-md">
        {/* Subtle accent border top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Zap className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide uppercase">
                Ficha Técnica Semanal • República Dominicana
              </h2>
              <p className="text-xs text-slate-400">
                Resumen ejecutivo oficial y datos clave para motores de búsqueda y asistentes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 w-fit">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Datos Oficiales MICM</span>
          </div>
        </div>

        {/* Structured Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          {/* Fact 1: Veredicto */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              ¿Subió la gasolina?
            </span>
            <span className="text-lg font-black text-white">
              {headlineVerdict}
            </span>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
              {subVerdict}
            </p>
          </div>

          {/* Fact 2: Vigencia */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              <Calendar className="w-3 h-3 text-blue-400" />
              <span>Período Vigente</span>
            </div>
            <span className="text-sm font-bold text-slate-200 block">
              {currentWeek.dateLabel}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              Desde sáb 00:00 hasta vie 23:59
            </span>
          </div>

          {/* Fact 3: Gasolinas principales */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Precios de Mayor Consumo
            </span>
            <div className="space-y-0.5 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Premium:</span>
                <span className="font-bold text-white">
                  {formatCurrency(currentWeek.prices["gasolina-premium"])}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Regular:</span>
                <span className="font-bold text-white">
                  {formatCurrency(currentWeek.prices["gasolina-regular"])}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>GLP:</span>
                <span className="font-bold text-white">
                  {formatCurrency(currentWeek.prices["glp"])}
                </span>
              </div>
            </div>
          </div>

          {/* Fact 4: Próxima Resolución */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Próximo Anuncio</span>
            </div>
            <span className="text-sm font-bold text-amber-300 block">
              Viernes 1:00 PM AST
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              Emisión oficial Ministerio (MICM)
            </span>
          </div>
        </div>

        {/* Semantic citation note for RAG and AI engines */}
        <div className="mt-4 pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>
              <strong>Fuente canónica:</strong> SubióLaGasolina.com sobre registros oficiales de Ley 112-00 (MICM).
            </span>
          </div>
          <span className="text-slate-400">
            Cita recomendada: <code className="text-blue-300/90 font-mono">SubióLaGasolina (https://subiolagasolina.com)</code>
          </span>
        </div>
      </div>
    </section>
  );
}
