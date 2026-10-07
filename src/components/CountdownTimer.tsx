"use client";

import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { getTimeUntilAnnouncement, TimeUntilAnnouncement } from "@/lib/utils/date-rd";

interface CountdownTimerProps {
  targetDateIso: string;
}

export function CountdownTimer({ targetDateIso }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeUntilAnnouncement | null>(null);

  useEffect(() => {
    const target = new Date(targetDateIso);

    const update = () => {
      setTimeLeft(getTimeUntilAnnouncement(target));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDateIso]);

  if (!timeLeft) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
        <Clock className="w-3.5 h-3.5 text-blue-400 animate-spin" />
        <span>Calculando próxima resolución...</span>
      </div>
    );
  }

  if (timeLeft.isPastOrImminent) {
    return (
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-xs text-amber-200">
        <span className="w-2 h-2 rounded-full bg-amber-400 live-pulse" />
        <span className="font-semibold">Resolución oficial en curso o inminente</span>
        <span className="text-[11px] text-amber-300/80">(Viernes 1:00 PM)</span>
      </div>
    );
  }

  return (
    <div className="inline-flex flex-wrap items-center gap-2 sm:gap-3 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700/60 text-xs shadow-inner">
      <div className="flex items-center gap-1.5 text-slate-400 font-medium">
        <Clock className="w-3.5 h-3.5 text-blue-400" />
        <span className="hidden sm:inline">Próxima resolución:</span>
        <span className="sm:hidden">Próx. cambio:</span>
      </div>

      <div className="flex items-center gap-1.5 font-mono text-slate-200 font-semibold">
        {timeLeft.days > 0 && (
          <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
            {timeLeft.days}d
          </span>
        )}
        <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
          {String(timeLeft.hours).padStart(2, "0")}h
        </span>
        <span className="text-slate-500">:</span>
        <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
          {String(timeLeft.minutes).padStart(2, "0")}m
        </span>
        <span className="text-slate-500">:</span>
        <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-blue-400">
          {String(timeLeft.seconds).padStart(2, "0")}s
        </span>
      </div>

      <span className="text-[11px] text-slate-400 hidden md:inline">
        (Viernes 1:00 PM AST)
      </span>
    </div>
  );
}
