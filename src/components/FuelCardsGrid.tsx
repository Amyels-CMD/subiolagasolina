"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  Fuel,
  Info,
  Layers,
} from "lucide-react";
import { FuelPriceItem } from "@/lib/types/fuel";
import { FUELS_META } from "@/lib/constants/fuels";
import { formatCurrency, formatDelta, formatPercentage, formatPriceNumber } from "@/lib/utils/format";

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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
            <Fuel className="w-4 h-4" />
            <span>Tablero Oficial de Precios</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Combustibles de Consumo Masivo
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-400">
          Precios por galón en pesos dominicanos (DOP)
        </p>
      </div>

      {/* Primary Consumer Fuels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-8">
        {consumerItems.map((item) => {
          const meta = FUELS_META[item.id];
          const isUp = item.change > 0;
          const isDown = item.change < 0;
          const isUnchanged = item.change === 0;

          return (
            <div
              key={item.id}
              className="data-card p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden group cursor-pointer"
              onClick={() => onSelectFuelForChart?.(item.id)}
            >
              {/* Subtle top accent line using fuel specific color */}
              <div
                className="absolute top-0 left-0 right-0 h-1 transition-all group-hover:h-1.5"
                style={{ backgroundColor: meta?.color.primary ?? "#3b82f6" }}
              />

              {/* Card Header: Name + Octane/Badge */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                      {item.name}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {meta?.octaneOrSpec ?? meta?.shortName}
                    </span>
                  </div>

                  {/* Variation Pill */}
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${
                      isUp
                        ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                        : isDown
                        ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                        : "bg-slate-800 text-slate-300 border border-slate-700"
                    }`}
                  >
                    {isUp && <TrendingUp className="w-3 h-3 text-rose-400" />}
                    {isDown && <TrendingDown className="w-3 h-3 text-emerald-400" />}
                    {isUnchanged && <Minus className="w-3 h-3 text-slate-400" />}
                    <span>{formatDelta(item.change)}</span>
                  </span>
                </div>

                {/* Big Number Price (isaiprofitable style) */}
                <div className="my-4">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs sm:text-sm font-semibold text-slate-400">
                      RD$
                    </span>
                    <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                      {formatPriceNumber(item.price)}
                    </span>
                    <span className="text-xs text-slate-400 font-medium ml-1">
                      / {item.unit}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Trend & info */}
              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isUp
                        ? "bg-rose-500"
                        : isDown
                        ? "bg-emerald-500"
                        : "bg-slate-500"
                    }`}
                  />
                  <span>
                    {isUnchanged
                      ? "Sin variación"
                      : `${isUp ? "Aumento de" : "Rebaja de"} ${formatPercentage(
                          Math.abs(item.percentageChange)
                        )}`}
                  </span>
                </div>

                <span className="text-[11px] text-blue-400/80 group-hover:text-blue-300 group-hover:underline">
                  Ver gráfica →
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Industrial Fuels Collapsible Section */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4 sm:p-5">
        <button
          type="button"
          onClick={() => setShowIndustrial(!showIndustrial)}
          className="w-full flex items-center justify-between text-left text-sm font-bold text-slate-300 hover:text-white transition-colors py-1"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>
              Combustibles Industriales y de Aviación ({industrialItems.length})
            </span>
            <span className="text-xs text-slate-400 font-normal hidden sm:inline">
              (Avtur, Kerosene, Fuel Oíl #6 y 1%S)
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs text-blue-400 font-medium">
            <span>{showIndustrial ? "Ocultar" : "Mostrar"}</span>
            {showIndustrial ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </button>

        {showIndustrial && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-4 pt-4 border-t border-white/10">
            {industrialItems.map((item) => {
              const isUp = item.change > 0;
              const isDown = item.change < 0;

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-800/60 border border-white/5 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <span className="font-semibold text-white text-sm">
                      {item.name}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                        isUp
                          ? "bg-rose-500/20 text-rose-300"
                          : isDown
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {formatDelta(item.change)}
                    </span>
                  </div>

                  <div className="mt-2">
                    <span className="text-xs text-slate-400 font-medium">RD$ </span>
                    <span className="text-2xl font-black text-white">
                      {formatPriceNumber(item.price)}
                    </span>
                    <span className="text-[11px] text-slate-400"> / gal</span>
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
