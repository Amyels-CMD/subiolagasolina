"use client";

import React, { useState } from "react";
import {
  Calculator,
  Car,
  Truck,
  Bike,
  Flame,
  Home,
  Building2,
} from "lucide-react";
import { WeeklyFuelRecord, FuelId } from "@/lib/types/fuel";
import { CONSUMER_FUELS, FUELS_META, VEHICLE_TANKS } from "@/lib/constants/fuels";
import { formatCurrency, formatDelta } from "@/lib/utils/format";

function VehicleSvgIcon({ iconKey, isSelected }: { iconKey: string; isSelected: boolean }) {
  const cls = `w-4 h-4 ${isSelected ? "text-slate-950" : "text-blue-400"}`;
  switch (iconKey) {
    case "car":
    case "compact":
      return <Car className={cls} />;
    case "suv":
    case "truck":
      return <Truck className={cls} />;
    case "bike":
      return <Bike className={cls} />;
    case "cylinder25":
      return <Flame className={cls} />;
    case "cylinder50":
      return <Home className={cls} />;
    case "cylinder100":
      return <Building2 className={cls} />;
    default:
      return <Car className={cls} />;
  }
}

interface TankCalculatorProps {
  currentWeek: WeeklyFuelRecord;
  previousWeek: WeeklyFuelRecord;
}

export function TankCalculator({ currentWeek, previousWeek }: TankCalculatorProps) {
  const [selectedFuel, setSelectedFuel] = useState<FuelId>("gasolina-premium");
  const [gallons, setGallons] = useState<number>(13); // Default typical sedan

  const fuelMeta = FUELS_META[selectedFuel];
  const currentPrice = currentWeek.prices[selectedFuel] ?? 0;
  const previousPrice = previousWeek.prices[selectedFuel] ?? currentPrice;

  const totalCurrentCost = Math.round(currentPrice * gallons * 100) / 100;
  const totalPreviousCost = Math.round(previousPrice * gallons * 100) / 100;
  const differenceCost = Math.round((totalCurrentCost - totalPreviousCost) * 100) / 100;

  return (
    <section id="calculadora" className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="py-6 border-b border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
              <Calculator className="w-4 h-4" />
              <span>Utilidad de Ahorro y Presupuesto</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              ¿Cuánto cuesta llenar tu tanque?
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Cálculo inmediato según tarifa oficial de la semana
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Controls Left Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Select Fuel */}
            <div>
              <label className="block text-xs uppercase font-bold text-slate-300 tracking-wider mb-2.5">
                1. Selecciona tu combustible
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CONSUMER_FUELS.map((fid) => {
                  const meta = FUELS_META[fid];
                  const isSelected = selectedFuel === fid;
                  return (
                    <button
                      key={fid}
                      type="button"
                      onClick={() => setSelectedFuel(fid)}
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        isSelected
                          ? "bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-500/10"
                          : "bg-slate-800/60 border-white/5 text-slate-400 hover:text-white hover:border-white/20"
                      }`}
                    >
                      <span className="block text-xs font-bold leading-tight">
                        {meta?.shortName ?? meta?.name}
                      </span>
                      <span className="block text-[11px] text-slate-400 font-mono mt-0.5">
                        RD$ {currentWeek.prices[fid]?.toFixed(2)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Presets or Custom Gallons */}
            <div>
              <label className="block text-xs uppercase font-bold text-slate-300 tracking-wider mb-2.5">
                2. Tamaño del vehículo o cilindro
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {VEHICLE_TANKS.map((preset) => {
                  const isSelected = gallons === preset.gallons;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setGallons(preset.gallons)}
                      className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
                        isSelected
                          ? "bg-white text-slate-950 border-white font-bold shadow-md"
                          : "bg-slate-800/60 border-white/5 text-slate-300 hover:border-white/20"
                      }`}
                    >
                      <div
                        className={`p-1.5 rounded-lg w-fit mb-2 ${
                          isSelected ? "bg-slate-200" : "bg-white/5"
                        }`}
                      >
                        <VehicleSvgIcon
                          iconKey={preset.iconKey}
                          isSelected={isSelected}
                        />
                      </div>
                      <div>
                        <span className="block text-xs font-semibold leading-snug truncate">
                          {preset.label}
                        </span>
                        <span className="block text-[11px] text-slate-400 font-mono mt-0.5">
                          {preset.gallons} {selectedFuel === "gas-natural" ? "m³" : "gal"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Slider for precision */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5">
                <div className="flex justify-between items-center text-xs mb-2 text-slate-300 font-medium">
                  <span>Cantidad personalizada:</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {gallons} {selectedFuel === "gas-natural" ? "m³" : "galones"}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="40"
                  step="0.5"
                  value={gallons}
                  onChange={(e) => setGallons(parseFloat(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Results Right Column */}
          <div className="lg:col-span-5">
            <div className="p-6 rounded-2xl bg-slate-950 border border-white/10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

              <span className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">
                Costo estimado para llenar
              </span>

              <div className="flex items-baseline gap-1 my-3">
                <span className="text-sm font-bold text-slate-400">RD$</span>
                <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                  {totalCurrentCost.toLocaleString("es-DO", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-white/10 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Combustible:</span>
                  <span className="font-semibold text-white">{fuelMeta?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Precio oficial por galón:</span>
                  <span className="font-mono text-white">
                    {formatCurrency(currentPrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Volumen cargado:</span>
                  <span className="font-mono text-white">
                    {gallons} {selectedFuel === "gas-natural" ? "m³" : "galones"}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/5 font-medium">
                  <span className="text-slate-400">Variación vs semana anterior:</span>
                  <span
                    className={
                      differenceCost > 0
                        ? "text-rose-400"
                        : differenceCost < 0
                        ? "text-emerald-400"
                        : "text-slate-300"
                    }
                  >
                    {formatDelta(differenceCost)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
