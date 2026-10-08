"use client";

import React, { useState } from "react";
import { ArrowUpRight, Fuel } from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants/site";
import { formatCurrency } from "@/lib/utils/format";

interface FuelSupportSectionProps {
  premiumPrice?: number;
  regularPrice?: number;
}

export function FuelSupportSection({
  premiumPrice = 353.1,
  regularPrice = 317.5,
}: FuelSupportSectionProps) {
  const [selectedFuel, setSelectedFuel] = useState<"premium" | "regular">("premium");

  const currentPrice = selectedFuel === "premium" ? premiumPrice : regularPrice;
  const currentLabel = selectedFuel === "premium" ? "Premium" : "Regular";

  const toggleFuel = () => {
    setSelectedFuel((prev) => (prev === "premium" ? "regular" : "premium"));
  };

  return (
    <section
      id="apoyar"
      aria-label="Apoyo al servidor"
      className="max-w-4xl mx-auto px-4 sm:px-6 my-8 sm:my-10"
    >
      {/* Sleek Dynamic Island / Capsule Widget */}
      <div className="relative rounded-full p-1 sm:p-1.5 bg-gradient-to-r from-amber-500/15 via-slate-900/80 to-amber-500/15 border border-white/10 hover:border-amber-500/30 transition-all duration-300 shadow-lg shadow-black/40 backdrop-blur-xl group">
        <div className="flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-1">
          {/* Left: Punchy witty copy */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
              <Fuel className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </span>
            <div className="text-xs sm:text-sm text-slate-300">
              <span className="font-semibold text-white">¿Te sirvió la web?</span>{" "}
              <span className="text-slate-400 hidden sm:inline">
                Invítame a un galón para mantener el servidor prendío.
              </span>
            </div>
          </div>

          {/* Right: Dynamic Price tag & sleek CTA */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleFuel}
              title="Haz clic para alternar entre Premium y Regular"
              className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-300 bg-white/[0.04] hover:bg-white/[0.08] active:scale-95 px-2.5 py-1 rounded-full border border-white/10 hover:border-amber-500/30 transition-all cursor-pointer"
            >
              <span className="text-amber-400 font-semibold">{currentLabel}</span>
              <span className="text-slate-500">≈</span>
              <span className="text-white font-bold">{formatCurrency(currentPrice)}</span>
            </button>
            <a
              href={SITE_CONFIG.buyMeACoffeeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 sm:gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 text-xs font-black transition-all shadow-sm shadow-amber-500/20 hover:shadow-amber-500/40"
            >
              <span>Invitar un galón</span>
              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
