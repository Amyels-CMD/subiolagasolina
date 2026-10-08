"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  Fuel,
  ArrowRight,
} from "lucide-react";
import { FuelPriceItem } from "@/lib/types/fuel";
import { FUELS_META } from "@/lib/constants/fuels";
import { formatDelta, formatPercentage, formatPriceNumber } from "@/lib/utils/format";

interface FuelCardsGridProps {
  consumerItems: FuelPriceItem[];
  industrialItems: FuelPriceItem[];
  onSelectFuelForChart?: (fuelId: string) => void;
}

export function FuelCardsGrid({
  consumerItems,
  industrialItems,
  onSelectFuelForChart,
}: FuelCardsGridProps) {
  const [showIndustrial, setShowIndustrial] = useState(false);

  return (
    <section id="precios" className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-4 mb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
            <Fuel className="w-4 h-4" />
            <span>Tablero Oficial de Tarifas</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Combustibles de Consumo Masivo
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-300">
          Precios fijados por galón en pesos dominicanos (DOP)
        </p>
      </div>

      {/* Terminal Rows List (Zero rounded card boxes! Pure data terminal like isaiprofitable.com) */}
      <div className="divide-y divide-white/10 border-b border-white/10">
        {consumerItems.map((item) => {
          const meta = FUELS_META[item.id];
          const isUp = item.change > 0;
          const isDown = item.change < 0;
          const isUnchanged = item.change === 0;

          return (
            <div
              key={item.id}
              onClick={() => {
                onSelectFuelForChart?.(item.id);
                const el = document.getElementById("grafica");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="py-4 sm:py-5 px-2 sm:px-4 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 hover:bg-white/[0.04] transition-colors cursor-pointer group rounded-lg"
            >
              {/* Left: Fuel Indicator & Name */}
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 sm:min-w-[240px]">
                <div
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: meta?.color.primary ?? "#3b82f6" }}
                />
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                    {item.name}
                  </h3>
                  <span className="text-xs text-slate-300 font-medium">
                    {meta?.octaneOrSpec ?? meta?.shortName}
                  </span>
                </div>
              </div>

              {/* Middle: Monospace Price */}
              <div className="flex items-baseline gap-2">
                <span className="text-xs sm:text-sm font-semibold text-slate-400">
                  RD$
                </span>
                <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                  {formatPriceNumber(item.price)}
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  / {item.unit}
                </span>
              </div>

              {/* Right: Variation Badge & Action */}
              <div className="flex items-center justify-between md:justify-end gap-4">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${
                    isUp
                      ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                      : isDown
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                  }`}
                >
                  {isUp && <TrendingUp className="w-3.5 h-3.5 text-rose-400" />}
                  {isDown && <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />}
                  {isUnchanged && <Minus className="w-3.5 h-3.5 text-amber-400" />}
                  <span>{formatDelta(item.change)}</span>
                  <span className="text-[11px] opacity-75">
                    ({isUnchanged ? "Sin cambio" : formatPercentage(Math.abs(item.percentageChange))})
                  </span>
                </span>

                <span className="text-xs text-blue-400 group-hover:text-blue-300 flex items-center gap-1 shrink-0 font-medium">
                  <span className="hidden sm:inline">Ver curva</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Industrial Fuels Section Toggle */}
      <div className="mt-6 pt-2">
        <button
          type="button"
          onClick={() => setShowIndustrial((prev) => !prev)}
          className="w-full py-3 flex items-center justify-between text-left text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-colors border-b border-white/10"
        >
          <span className="flex items-center gap-2">
            <span>Combustibles Industriales y de Aviación ({industrialItems.length})</span>
            <span className="text-[11px] text-slate-400 font-normal">
              (Avtur, Kerosene, Fuel Oil)
            </span>
          </span>
          <span className="flex items-center gap-1 text-blue-400">
            <span>{showIndustrial ? "Ocultar" : "Mostrar"}</span>
            {showIndustrial ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </span>
        </button>

        {showIndustrial && (
          <div className="divide-y divide-white/10 border-b border-white/10">
            {industrialItems.map((item) => {
              const meta = FUELS_META[item.id];
              return (
                <div
                  key={item.id}
                  className="py-3 px-2 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-white/[0.02] text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: meta?.color.primary ?? "#64748b" }}
                    />
                    <span className="font-bold text-white">{item.name}</span>
                    <span className="text-slate-400 text-[11px]">
                      {meta?.octaneOrSpec}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-mono font-bold text-white text-sm">
                      RD$ {formatPriceNumber(item.price)} / {item.unit}
                    </span>
                    <span className="text-slate-400 font-mono">
                      {formatDelta(item.change)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
