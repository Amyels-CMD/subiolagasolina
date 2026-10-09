"use client";

import React from "react";
import { Calendar, Building2, Info, AlertTriangle } from "lucide-react";
import { WeeklySummary } from "@/lib/types/fuel";
import { DominicanFlag } from "@/components/DominicanFlag";
import { CountdownTimer } from "@/components/CountdownTimer";
import { ShareButtons } from "@/components/ShareButtons";

interface HeroVerdictProps {
  summary: WeeklySummary;
}

export function HeroVerdict({ summary }: HeroVerdictProps) {
  const { currentWeek, nextUpdateDate, verdicts } = summary;
  const { gasoline, consumer, market } = verdicts;

  const isUp = gasoline.tone === "danger";
  const isDown = gasoline.tone === "success";
  const isMixed = gasoline.tone === "warning";

  const primaryWord = gasoline.primaryWord;
  const secondaryPhrase = gasoline.secondaryPhrase;
  const subVerdict = gasoline.subtext;

  const verdictNote =
    gasoline.tone === "neutral"
      ? "Precios de gasolinas sin cambios respecto a la semana anterior."
      : isUp
      ? "Alzas aprobadas para el período vigente."
      : isMixed
      ? "Resolución con variaciones encontradas entre gasolinas."
      : "Rebajas directas aplicadas para el consumidor.";


  return (
    <section id="veredicto-principal" className="relative pt-6 sm:pt-10 md:pt-12 pb-10 sm:pb-14 border-b border-white/10">
      {/* Expansive ambient spotlight tailored to verdict state */}
      <div
        className={`absolute top-0 right-0 w-[350px] sm:w-[600px] md:w-[850px] h-[350px] sm:h-[500px] md:h-[600px] rounded-full blur-[140px] pointer-events-none -z-10 opacity-25 ${
          isUp
            ? "bg-rose-500"
            : isDown
            ? "bg-emerald-500"
            : "bg-amber-500"
        }`}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Top brand & official source bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-semibold text-slate-300 mb-6 sm:mb-8 pb-3 border-b border-white/5">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-black text-white tracking-tight text-base sm:text-lg">
              subiólagasolina
            </span>
            <DominicanFlag className="w-4 h-3 sm:w-5 sm:h-3.5 rounded-[1px] shadow-sm" />
          </div>
          <div className="inline-flex items-center gap-1.5 text-emerald-400 font-medium text-xs sm:text-sm shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 live-pulse inline-block" />
            <span><span className="hidden sm:inline">Resolución </span>Oficial MICM (Ley 112-00)</span>
          </div>
        </div>

        {/* Core Hero: Question + Verdict (Coupled directly together) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
          {/* Question Block */}
          <div className="lg:col-span-7 space-y-3 sm:space-y-4">
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-5xl xl:text-[4.5rem] font-black text-white tracking-tighter leading-[0.98]">
              ¿Subió la gasolina esta semana en RD?
            </h1>

            {/* Subtitle on Desktop (hidden on mobile to keep verdict immediately after title) */}
            <p className="hidden lg:block text-base sm:text-lg text-slate-200 font-normal leading-relaxed max-w-xl">
              {subVerdict}
            </p>
          </div>

          {/* Verdict Block (Renders immediately after question on mobile, right column on desktop) */}
          <div className="lg:col-span-5 text-left lg:text-right pt-2 lg:pt-0">
            <span
              className={`text-xs sm:text-sm uppercase font-extrabold tracking-widest block mb-1 sm:mb-2 ${
                isUp
                  ? "text-rose-400/80"
                  : isDown
                  ? "text-emerald-400/80"
                  : "text-amber-400/80"
              }`}
            >
              Veredicto Oficial
            </span>
            <div
              className={`text-7xl sm:text-8xl md:text-9xl lg:text-[7.5rem] xl:text-[10.5rem] font-black tracking-tighter leading-[0.80] select-none uppercase ${
                isUp
                  ? "text-rose-500 drop-shadow-[0_0_60px_rgba(244,63,94,0.45)]"
                  : isDown
                  ? "text-emerald-400 drop-shadow-[0_0_60px_rgba(16,185,129,0.45)]"
                  : "text-amber-400 drop-shadow-[0_0_60px_rgba(245,158,11,0.45)]"
              }`}
            >
              {primaryWord}
            </div>
            <div
              className={`text-2xl sm:text-3xl md:text-4xl lg:text-3xl xl:text-5xl font-black tracking-tight mt-1 sm:mt-2 uppercase ${
                isUp
                  ? "text-rose-200"
                  : isDown
                  ? "text-emerald-200"
                  : "text-amber-200"
              }`}
            >
              {secondaryPhrase}
            </div>

            {/* Mobile-only subtitle (rendered right under the verdict for immediate context) */}
            <p className="lg:hidden text-sm sm:text-base text-slate-300 font-normal leading-relaxed mt-3 max-w-xl">
              {subVerdict}
            </p>

            {/* Desktop-only secondary note */}
            <p className="hidden lg:block text-xs sm:text-sm md:text-base text-slate-300 mt-2 max-w-xs lg:ml-auto leading-normal">
              {verdictNote}
            </p>
          </div>
        </div>

        {/* Contextual Intelligence Banner: Informs user if other non-gasoline fuels moved */}
        {consumer.hasNotableOtherChanges && consumer.notableChangeSummary && (
          <div className="mt-6 py-2.5 px-3 sm:px-4 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center gap-2 text-xs sm:text-sm text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{consumer.notableChangeSummary}</span>
          </div>
        )}

        {!consumer.hasNotableOtherChanges && market.state !== "unchanged" && (
          <div className="mt-6 py-2 px-3 sm:px-4 rounded-lg bg-slate-800/80 border border-white/10 flex items-center gap-2 text-xs text-slate-300">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              Combustibles de consumo masivo sin variación. Ajustes registrados únicamente en derivados industriales y de aviación.
            </span>
          </div>
        )}

        {/* Hero Utility Strip: Official Period, Regulation, Countdown & Share */}
        <div className="relative mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">

          {/* Ambient specular beam cast from the verdict down along the divider */}
          <div
            className={`absolute -top-[1px] right-0 w-full sm:w-2/3 md:w-1/2 h-[1px] pointer-events-none ${
              isUp
                ? "bg-gradient-to-l from-rose-500/60 via-rose-500/25 to-transparent"
                : isDown
                ? "bg-gradient-to-l from-emerald-500/60 via-emerald-500/25 to-transparent"
                : "bg-gradient-to-l from-amber-400/60 via-amber-400/25 to-transparent"
            }`}
          />
          {/* Subtle localized ambient glow pooling behind the action buttons */}
          <div
            className={`absolute -bottom-4 right-0 w-80 h-28 rounded-full blur-[100px] pointer-events-none -z-10 opacity-20 ${
              isUp
                ? "bg-rose-500"
                : isDown
                ? "bg-emerald-500"
                : "bg-amber-500"
            }`}
          />

          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-3 text-xs sm:text-sm text-slate-300">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10">
              <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>
                Período: <strong className="text-white font-semibold">{currentWeek.dateLabel}</strong>
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10">
              <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                Regulación: <strong className="text-white font-semibold">Ley 112-00 (MICM)</strong>
              </span>
            </div>
          </div>

          {/* Action strip: Countdown + Share buttons bathed in verdict light */}
          <div className="flex flex-wrap items-center gap-3">
            <CountdownTimer
              targetDateIso={nextUpdateDate}
              announcementDateIso={currentWeek.announcementDate}
              effectivePeriodLabel={currentWeek.dateLabel}
              tone={isUp ? "rose" : isDown ? "emerald" : "amber"}
            />
            <ShareButtons summary={summary} className="justify-start my-0" />
          </div>
        </div>
      </div>
    </section>
  );
}
