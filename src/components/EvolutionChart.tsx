"use client";

import React, { useState, useMemo } from "react";
import { LineChart as ChartIcon, Info } from "lucide-react";
import { WeeklyFuelRecord, FuelId } from "@/lib/types/fuel";
import { CONSUMER_FUELS, FUELS_META } from "@/lib/constants/fuels";
import { formatCurrency, formatDelta, formatPercentage } from "@/lib/utils/format";

interface EvolutionChartProps {
  history: WeeklyFuelRecord[];
  initialFuelId?: FuelId;
}

const TIME_RANGES = [
  { label: "4 Semanas", value: 4 },
  { label: "12 Semanas", value: 12 },
  { label: "26 Semanas (6M)", value: 26 },
  { label: "Año 2026", value: 40 },
  { label: "Todo", value: 120 },
];

export function EvolutionChart({ history, initialFuelId = "gasolina-premium" }: EvolutionChartProps) {
  const [selectedFuel, setSelectedFuel] = useState<FuelId>(initialFuelId);
  const [weeksLimit, setWeeksLimit] = useState<number>(26);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const fuelMeta = FUELS_META[selectedFuel];

  // Filter history points
  const points = useMemo(() => {
    const slice = history.slice(-weeksLimit);
    return slice.map((rec, idx) => {
      const price = rec.prices[selectedFuel] ?? 0;
      const prevPrice = idx > 0 ? (slice[idx - 1].prices[selectedFuel] ?? price) : price;
      const delta = Math.round((price - prevPrice) * 100) / 100;
      return {
        date: rec.startDate,
        shortLabel: rec.shortDateLabel,
        dateLabel: rec.dateLabel,
        price,
        delta,
      };
    });
  }, [history, selectedFuel, weeksLimit]);

  // Statistics for selected range
  const stats = useMemo(() => {
    if (points.length === 0) return { min: 0, max: 0, current: 0, first: 0, totalDelta: 0, totalPct: 0 };
    const prices = points.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const current = prices[prices.length - 1];
    const first = prices[0];
    const totalDelta = Math.round((current - first) * 100) / 100;
    const totalPct = first > 0 ? Math.round(((current - first) / first) * 10000) / 100 : 0;
    return { min, max, current, first, totalDelta, totalPct };
  }, [points]);

  // SVG Coordinates calculation
  const svgWidth = 800;
  const svgHeight = 280;
  const paddingX = 40;
  const paddingY = 30;

  const chartPoints = useMemo(() => {
    if (points.length === 0) return [];
    const minVal = Math.floor(stats.min * 0.98);
    const maxVal = Math.ceil(stats.max * 1.02);
    const range = maxVal - minVal || 1;

    return points.map((p, idx) => {
      const x =
        paddingX +
        (idx / Math.max(1, points.length - 1)) * (svgWidth - paddingX * 2);
      const y =
        svgHeight -
        paddingY -
        ((p.price - minVal) / range) * (svgHeight - paddingY * 2);
      return { ...p, x, y };
    });
  }, [points, stats.min, stats.max]);

  // SVG Path generator
  const pathD = useMemo(() => {
    if (chartPoints.length === 0) return "";
    return chartPoints.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, "");
  }, [chartPoints]);

  const areaD = useMemo(() => {
    if (chartPoints.length === 0) return "";
    const first = chartPoints[0];
    const last = chartPoints[chartPoints.length - 1];
    const baseline = svgHeight - paddingY;
    return `${pathD} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;
  }, [chartPoints, pathD]);

  const activePoint = hoveredIndex !== null && chartPoints[hoveredIndex]
    ? chartPoints[hoveredIndex]
    : chartPoints[chartPoints.length - 1];

  const primaryColor = fuelMeta?.color.primary ?? "#3b82f6";

  return (
    <section id="grafica" className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="py-6 border-b border-white/10">
        {/* Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
              <ChartIcon className="w-4 h-4" />
              <span>Evolución Histórica</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Curva de Precios: {fuelMeta?.name}
            </h2>
          </div>

          {/* Timeframe selector pills */}
          <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-white/10 overflow-x-auto max-w-full scrollbar-none shrink-0">
            {TIME_RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setWeeksLimit(r.value)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all ${
                  weeksLimit === r.value
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Fuel Type Chips */}
        <div className="flex items-center gap-2 overflow-x-auto py-4 scrollbar-none">
          {CONSUMER_FUELS.map((fid) => {
            const meta = FUELS_META[fid];
            const isSelected = selectedFuel === fid;
            return (
              <button
                key={fid}
                type="button"
                onClick={() => setSelectedFuel(fid)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all flex items-center gap-2 border ${
                  isSelected
                    ? "bg-white text-slate-950 border-white shadow-lg"
                    : "bg-slate-800/80 text-slate-300 border-white/5 hover:border-white/20 hover:text-white"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: meta?.color.primary ?? "#3b82f6" }}
                />
                <span>{meta?.shortName ?? meta?.name}</span>
              </button>
            );
          })}
        </div>

        {/* Range Stat Summary Banner (Unboxed, clean border dividers) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-4 py-4 border-y border-white/10">
          <div>
            <span className="block text-[11px] text-slate-400 uppercase font-semibold">
              Precio Seleccionado
            </span>
            <span className="text-lg sm:text-xl font-black text-white">
              {formatCurrency(activePoint?.price ?? stats.current)}
            </span>
            <span className="text-[10px] text-slate-400 block truncate">
              {activePoint?.dateLabel ?? "Última semana"}
            </span>
          </div>

          <div>
            <span className="block text-[11px] text-slate-400 uppercase font-semibold">
              Mínimo del Período
            </span>
            <span className="text-lg sm:text-xl font-bold text-slate-300">
              {formatCurrency(stats.min)}
            </span>
            <span className="text-[10px] text-slate-400 block">Suelo registrado</span>
          </div>

          <div>
            <span className="block text-[11px] text-slate-400 uppercase font-semibold">
              Máximo del Período
            </span>
            <span className="text-lg sm:text-xl font-bold text-slate-300">
              {formatCurrency(stats.max)}
            </span>
            <span className="text-[10px] text-slate-400 block">Techo registrado</span>
          </div>

          <div>
            <span className="block text-[11px] text-slate-400 uppercase font-semibold">
              Variación en Período
            </span>
            <span
              className={`text-lg sm:text-xl font-black ${
                stats.totalDelta > 0
                  ? "text-rose-400"
                  : stats.totalDelta < 0
                  ? "text-emerald-400"
                  : "text-slate-300"
              }`}
            >
              {formatDelta(stats.totalDelta)}
            </span>
            <span className="text-[10px] text-slate-400 block">
              {formatPercentage(stats.totalPct)} vs inicio
            </span>
          </div>
        </div>

        {/* Historical Context Note for Multi-Year Ranges */}
        {weeksLimit > 26 && (
          <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200 flex items-start sm:items-center gap-2.5 leading-relaxed">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5 sm:mt-0" />
            <span>
              <strong className="text-white">Contexto del subsidio estatal:</strong> En República Dominicana, el Gobierno implementó desde 2021 una política extraordinaria de subsidios a los combustibles que, especialmente entre 2022 y 2025, permitió mantener sin variaciones durante largos períodos los precios de los principales combustibles de consumo doméstico, absorbiendo parte del impacto de las fuertes fluctuaciones internacionales y buscando contener su efecto sobre la inflación (con más de RD$ 35,500 millones en 2022 y más de RD$ 85,000 millones acumulados a mediados de 2025).
            </span>
          </div>
        )}

        {/* SVG Interactive Chart */}
        <div className="relative w-full aspect-[21/9] sm:aspect-[24/9] min-h-[220px] max-h-[340px] mt-2 overflow-hidden">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-full"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={primaryColor} stopOpacity="0.35" />
                <stop offset="100%" stopColor={primaryColor} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0.2, 0.5, 0.8].map((ratio, idx) => {
              const y = paddingY + ratio * (svgHeight - paddingY * 2);
              return (
                <line
                  key={idx}
                  x1={paddingX}
                  y1={y}
                  x2={svgWidth - paddingX}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.07)"
                  strokeDasharray="4 4"
                />
              );
            })}

            {/* Area Fill */}
            {areaD && <path d={areaD} fill="url(#areaGradient)" />}

            {/* Line Path */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke={primaryColor}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Interactive Points and Hover Circles */}
            {chartPoints.map((pt, idx) => {
              const isHovered = hoveredIndex === idx;
              return (
                <g key={idx}>
                  {/* Invisible hit target for easy mouse hover */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={chartPoints.length > 30 ? 6 : 10}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onTouchStart={() => setHoveredIndex(idx)}
                  />

                  {/* Visual Dot on key points or hovered */}
                  {(isHovered || idx === chartPoints.length - 1 || idx === 0) && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 6 : 4}
                      fill={primaryColor}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  )}
                </g>
              );
            })}

            {/* Vertical crosshair line for hovered point */}
            {activePoint && (
              <line
                x1={activePoint.x}
                y1={paddingY}
                x2={activePoint.x}
                y2={svgHeight - paddingY}
                stroke="rgba(255, 255, 255, 0.3)"
                strokeDasharray="2 2"
              />
            )}
          </svg>
        </div>

        {/* Date labels along bottom */}
        <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 px-2 border-t border-white/5">
          <span>{chartPoints[0]?.shortLabel ?? ""}</span>
          <span className="hidden sm:inline">
            Pasa el cursor o toca para consultar cualquier semana
          </span>
          <span>{chartPoints[chartPoints.length - 1]?.shortLabel ?? ""}</span>
        </div>
      </div>
    </section>
  );
}
