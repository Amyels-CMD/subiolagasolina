import React from "react";
import { CheckCircle2, TrendingDown, TrendingUp, AlertCircle, Sparkles, Building2 } from "lucide-react";
import { WeeklySummary } from "@/lib/types/fuel";
import { CountdownTimer } from "@/components/CountdownTimer";

interface HeroVerdictProps {
  summary: WeeklySummary;
}

export function HeroVerdict({ summary }: HeroVerdictProps) {
  const { headlineVerdict, subVerdict, currentWeek, nextUpdateDate } = summary;

  const isUp = summary.hasIncreased;
  const isDown = summary.hasDecreased && !summary.hasIncreased;
  const isUnchanged = summary.isUnchanged;

  return (
    <section className="relative pt-6 pb-12 sm:pt-10 sm:pb-16 text-center">
      {/* Background glow orb */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-[500px] h-72 sm:h-[350px] rounded-full blur-[100px] pointer-events-none -z-10 ${
          isUp
            ? "bg-rose-600/15"
            : isDown
            ? "bg-emerald-600/15"
            : "bg-blue-600/15"
        }`}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col items-center">
        {/* Subtitle query */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs sm:text-sm font-medium text-slate-300 mb-6 backdrop-blur-sm">
          <span>¿Subió la gasolina en República Dominicana esta semana?</span>
        </div>

        {/* Giant Visceral Hero Verdict (Inspired by isaiprofitable.com) */}
        <div className="mb-6">
          <h1
            className={`text-5xl sm:text-7xl md:text-8xl font-black tracking-tight leading-none ${
              isUp
                ? "text-rose-500 drop-shadow-[0_0_35px_rgba(244,63,94,0.4)]"
                : isDown
                ? "text-emerald-400 drop-shadow-[0_0_35px_rgba(16,185,129,0.4)]"
                : "text-white drop-shadow-[0_0_35px_rgba(59,130,246,0.3)]"
            }`}
          >
            {headlineVerdict}
          </h1>
        </div>

        {/* Descriptive verdict context */}
        <p className="max-w-2xl text-base sm:text-lg text-slate-300 font-normal leading-relaxed mb-6">
          {subVerdict}
        </p>

        {/* Resolution dates & Subsidies card */}
        <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {/* Card 1: Período oficial */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-900/70 border border-white/10 text-left">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                Período Oficial Vigente
              </span>
              <span className="text-sm font-semibold text-white">
                {currentWeek.dateLabel}
              </span>
            </div>
          </div>

          {/* Card 2: Fuente oficial reguladora */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-900/70 border border-white/10 text-left">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                Fuente Reguladora Oficial
              </span>
              <span className="text-sm font-semibold text-white">
                MICM • Ley 112-00
              </span>
            </div>
          </div>
        </div>

        {/* Live Countdown to Next Resolution */}
        <CountdownTimer targetDateIso={nextUpdateDate} />
      </div>
    </section>
  );
}
