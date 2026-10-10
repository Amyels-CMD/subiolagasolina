import React from "react";
import { WeeklySummary } from "@/lib/types/fuel";
import { formatCurrency } from "@/lib/utils/format";
import { Database, Calendar, ShieldCheck, Terminal, Flame, Rss } from "lucide-react";

interface QuickFactsSummaryProps {
  summary: WeeklySummary;
}

export function QuickFactsSummary({ summary }: QuickFactsSummaryProps) {
  const { currentWeek, wti } = summary;

  return (
    <section
      id="resumen-rapido"
      aria-label="Ficha de datos y especificaciones oficiales"
      className="max-w-6xl mx-auto px-4 sm:px-6 my-4"
    >
      {/* Unboxed Terminal Ribbon: 4 clean columns separated by thin borders */}
      <div className="py-4 border-b border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
        {/* Column 1: Vigencia del Período */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5" />
            <span>Período Vigente</span>
          </div>
          <div className="text-sm sm:text-base font-bold text-white font-mono">
            {currentWeek.dateLabel}
          </div>
          <p className="text-xs text-slate-300">
            Aplica desde sáb 00:00 hasta vie 23:59 en toda RD
          </p>
        </div>

        {/* Column 2: Petróleo WTI Internacional */}
        <div className="space-y-1 sm:border-l sm:border-white/10 sm:pl-6">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5" />
            <span>Crudo WTI (Texas)</span>
          </div>
          <div className="text-sm sm:text-base font-bold text-white font-mono flex items-center gap-2">
            <span>US$ {wti ? wti.priceUsd.toFixed(2) : "91.85"}</span>
            <span
              className={`text-[11px] font-semibold px-1.5 py-0.5 rounded border ${
                wti && wti.changeUsd > 0
                  ? "bg-rose-500/15 text-rose-400 border-rose-500/20"
                  : "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
              }`}
            >
              {wti && wti.changeUsd <= 0 ? "▼" : "▲"} {wti ? Math.abs(wti.percentageChange).toFixed(1) : "2.7"}%
            </span>
          </div>
          <p className="text-xs text-slate-300">
            Referencia de paridad que rige subsidios MICM
          </p>
        </div>

        {/* Column 3: Tarifa Clave de Consumo */}
        <div className="space-y-1 lg:border-l lg:border-white/10 lg:pl-6">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Precio en la Bomba</span>
          </div>

          <div className="text-sm sm:text-base font-bold text-white font-mono flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span>Premium {formatCurrency(currentWeek.prices["gasolina-premium"])}</span>
            <span className="text-slate-500">•</span>
            <span>GLP {formatCurrency(currentWeek.prices["glp"])}</span>
          </div>
          <p className="text-xs text-slate-300">
            Precios oficiales sin cambios bajo Ley 112-00
          </p>
        </div>

        {/* Column 4: Datos Abiertos & Feeds */}
        <div className="space-y-1 sm:border-l sm:border-white/10 sm:pl-6">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
            <Terminal className="w-3.5 h-3.5" />
            <span>Datos Abiertos & Feeds</span>
          </div>
          <div className="text-sm sm:text-base font-bold text-white font-mono flex items-center gap-3">
            <a href="/api/prices" className="hover:text-cyan-300 underline underline-offset-2 decoration-cyan-500/40">
              /api/prices
            </a>
            <span className="text-slate-500">•</span>
            <a href="/feed.xml" className="inline-flex items-center gap-1 hover:text-amber-300 text-xs text-amber-400 font-sans font-semibold">
              <Rss className="w-3 h-3" />
              <span>RSS</span>
            </a>
          </div>
          <p className="text-xs text-slate-300">
            Acceso libre en JSON y XML sin registros ni cuotas
          </p>
        </div>
      </div>

      {/* Semantic Citation Note for Voice/AI Engines */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-300">
        <span className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span>Fuente canónica: subiolagasolina.com (Resoluciones oficiales MICM)</span>
        </span>
        <span className="font-mono text-[11px] text-blue-300">
          Cita: https://subiolagasolina.com
        </span>
      </div>
    </section>
  );
}
