"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import { Clock, Sparkles } from "lucide-react";
import {
  getAnnouncementLifecycle,
  AnnouncementPhase,
  TimeUntilAnnouncement,
} from "@/lib/utils/date-rd";

interface CountdownTimerProps {
  targetDateIso: string;
  announcementDateIso?: string;
  effectivePeriodLabel?: string;
  tone?: "rose" | "emerald" | "amber";
}

const emptySubscribe = () => () => {};

export function CountdownTimer({
  targetDateIso,
  announcementDateIso = "",
  effectivePeriodLabel = "",
  tone = "amber",
}: CountdownTimerProps) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [lifecycle, setLifecycle] = useState<{
    phase: AnnouncementPhase;
    timeLeft: TimeUntilAnnouncement;
    isFriday: boolean;
    hoursUntilMidnight: number;
  }>(() =>
    getAnnouncementLifecycle(announcementDateIso, new Date(targetDateIso))
  );

  const toneStyles =
    tone === "rose"
      ? "bg-gradient-to-b from-rose-500/[0.09] via-slate-900/90 to-slate-950/95 border-t-rose-400/40 border-x-white/10 border-b-white/5 shadow-rose-950/40"
      : tone === "emerald"
      ? "bg-gradient-to-b from-emerald-500/[0.09] via-slate-900/90 to-slate-950/95 border-t-emerald-400/40 border-x-white/10 border-b-white/5 shadow-emerald-950/40"
      : "bg-gradient-to-b from-amber-500/[0.10] via-slate-900/90 to-slate-950/95 border-t-amber-400/40 border-x-white/10 border-b-white/5 shadow-amber-950/40";

  useEffect(() => {
    const target = new Date(targetDateIso);

    const update = () => {
      setLifecycle(getAnnouncementLifecycle(announcementDateIso, target));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDateIso, announcementDateIso]);

  if (!isMounted) {
    return (
      <div className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl ${toneStyles} text-xs text-slate-400 shadow-md backdrop-blur-md`}>
        <Clock className="w-3.5 h-3.5 text-blue-400" />
        <span>Próxima resolución oficial: Viernes 1:00 PM AST</span>
      </div>
    );
  }

  // Phase 2: Friday >= 1:00 PM AST while government bulletin is still pending/delayed
  if (lifecycle.phase === "waiting_official" || (lifecycle.timeLeft.totalMs <= 0 && lifecycle.isFriday)) {
    return (
      <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-200 shadow-md backdrop-blur-md">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 live-pulse shrink-0" />
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="font-bold text-white">1:00 PM AST cumplida</span>
          <span className="text-amber-300/90">
            • Esperando divulgación oficial del MICM de hoy
          </span>
        </div>
      </div>
    );
  }

  // Phase 3: Friday afternoon/night once newly published (in effect starting midnight Saturday 00:00)
  if (lifecycle.phase === "effective_tonight") {
    return (
      <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-200 shadow-md backdrop-blur-md">
        <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="font-bold text-white">Tarifas recién anunciadas</span>
          <span className="text-emerald-300">
            • Entran en vigor a medianoche (Sábado 00:00)
          </span>
          {effectivePeriodLabel && (
            <span className="text-[11px] text-emerald-400/80">({effectivePeriodLabel})</span>
          )}
        </div>
      </div>
    );
  }

  const { timeLeft } = lifecycle;


  return (
    <div
      suppressHydrationWarning
      className={`inline-flex flex-wrap items-center gap-2 sm:gap-3 px-3.5 py-2 rounded-xl ${toneStyles} text-xs shadow-md backdrop-blur-md`}
    >
      <div className="flex items-center gap-1.5 text-slate-400 font-medium">
        <Clock className="w-3.5 h-3.5 text-blue-400" />
        <span className="hidden sm:inline">Próxima resolución:</span>
        <span className="sm:hidden">Próx. cambio:</span>
      </div>

      <div
        suppressHydrationWarning
        className="flex items-center gap-1.5 font-mono text-slate-200 font-semibold"
      >
        {timeLeft.days > 0 && (
          <span
            suppressHydrationWarning
            className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700"
          >
            {timeLeft.days}d
          </span>
        )}
        <span
          suppressHydrationWarning
          className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700"
        >
          {String(timeLeft.hours).padStart(2, "0")}h
        </span>
        <span className="text-slate-500">:</span>
        <span
          suppressHydrationWarning
          className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700"
        >
          {String(timeLeft.minutes).padStart(2, "0")}m
        </span>
        <span className="text-slate-500">:</span>
        <span
          suppressHydrationWarning
          className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-blue-400"
        >
          {String(timeLeft.seconds).padStart(2, "0")}s
        </span>
      </div>

      <span className="text-[11px] text-slate-400 hidden md:inline">
        (Viernes 1:00 PM AST)
      </span>
    </div>
  );
}
