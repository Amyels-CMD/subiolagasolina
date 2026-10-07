"use client";

import React, { useState } from "react";
import { Share2, Check, Copy } from "lucide-react";
import { WeeklySummary } from "@/lib/types/fuel";
import { formatCurrency, formatDelta } from "@/lib/utils/format";

interface ShareButtonsProps {
  summary: WeeklySummary;
}

export function ShareButtons({ summary }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const { currentWeek, consumerItems, headlineVerdict } = summary;

  const buildShareText = () => {
    const lines = [
      `⛽ ¿Subió la gasolina esta semana en RD? 👉 ${headlineVerdict}`,
      `📅 Período: ${currentWeek.dateLabel}`,
      "",
      ...consumerItems.map(
        (i) =>
          `• ${i.name}: ${formatCurrency(i.price)} (${
            i.change === 0 ? "Sin cambio" : formatDelta(i.change)
          })`
      ),
      "",
      "Consulta el histórico oficial en:",
      "https://subiolagasolina.com",
    ];
    return lines.join("\n");
  };

  const handleCopy = async () => {
    const text = buildShareText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(buildShareText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const handleTwitter = () => {
    const text = encodeURIComponent(
      `¿Subió la gasolina en RD esta semana? 👉 ${headlineVerdict}. Revisa los precios oficiales actualizados del MICM: https://subiolagasolina.com`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5 my-6">
      <button
        type="button"
        onClick={handleWhatsApp}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
      >
        <span>💬 Enviar por WhatsApp</span>
      </button>

      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-bold transition-all"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-300">¡Copiado!</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            <span>Copiar resumen</span>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={handleTwitter}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 text-xs font-semibold transition-all"
      >
        <span>Compartir en X</span>
      </button>
    </div>
  );
}
