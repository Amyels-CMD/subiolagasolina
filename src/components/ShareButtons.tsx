"use client";

import React, { useState, useEffect } from "react";
import { Share2, Check, Copy } from "lucide-react";
import { WeeklySummary } from "@/lib/types/fuel";
import { formatCurrency, formatDelta } from "@/lib/utils/format";
import { getBaseUrl } from "@/lib/utils/url";

interface ShareButtonsProps {
  summary: WeeklySummary;
  className?: string;
}

export function ShareButtons({ summary, className = "" }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>("https://subiolagasolina.com");

  useEffect(() => {
    if (typeof window !== "undefined" && window.location?.origin) {
      setShareUrl(window.location.origin);
    }
  }, []);

  const getActiveShareUrl = () => {
    if (typeof window !== "undefined" && window.location?.origin) {
      return window.location.origin;
    }
    return shareUrl || getBaseUrl();
  };

  const { currentWeek, consumerItems, headlineVerdict } = summary;

  const buildShareText = () => {
    const activeUrl = getActiveShareUrl();
    const lines = [
      `¿Subió la gasolina esta semana en República Dominicana? -> ${headlineVerdict}`,
      `Período oficial: ${currentWeek.dateLabel}`,
      "",
      ...consumerItems.map(
        (i) =>
          `• ${i.name}: ${formatCurrency(i.price)} (${
            i.change === 0 ? "Sin cambio" : formatDelta(i.change)
          })`
      ),
      "",
      "Consulta el histórico oficial en:",
      activeUrl,
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

  const handleNativeShare = async () => {
    const activeUrl = getActiveShareUrl();
    const text = `¿Subió la gasolina esta semana en RD? -> ${headlineVerdict}\nPrecios oficiales vigentes (${currentWeek.shortDateLabel}):\n• Premium: ${formatCurrency(
      currentWeek.prices["gasolina-premium"]
    )}\n• Regular: ${formatCurrency(
      currentWeek.prices["gasolina-regular"]
    )}\n• GLP: ${formatCurrency(currentWeek.prices["glp"])}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "¿Subió la gasolina esta semana en República Dominicana?",
          text,
          url: activeUrl,
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(buildShareText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const handleTelegram = () => {
    const activeUrl = getActiveShareUrl();
    const text = encodeURIComponent(
      `¿Subió la gasolina esta semana en RD? -> ${headlineVerdict}\nPrecios oficiales del MICM:`
    );
    const url = encodeURIComponent(activeUrl);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, "_blank");
  };

  const handleTwitter = () => {
    const activeUrl = getActiveShareUrl();
    const text = encodeURIComponent(
      `¿Subió la gasolina en RD esta semana? -> ${headlineVerdict}. Precios oficiales actualizados del MICM: ${activeUrl}`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  const isUp = summary.hasIncreased;
  const isDown = summary.hasDecreased && !summary.hasIncreased;

  // Verdict-driven ambient lighting & specular reflections
  const verdictLighting = isUp
    ? {
        bg: "bg-gradient-to-b from-rose-500/[0.09] via-slate-900/90 to-slate-950/95",
        border: "border-t-rose-400/40 border-x-white/10 border-b-white/5 hover:border-rose-400/60",
        shadow: "shadow-md shadow-rose-950/40 hover:shadow-rose-500/15",
      }
    : isDown
    ? {
        bg: "bg-gradient-to-b from-emerald-500/[0.09] via-slate-900/90 to-slate-950/95",
        border: "border-t-emerald-400/40 border-x-white/10 border-b-white/5 hover:border-emerald-400/60",
        shadow: "shadow-md shadow-emerald-950/40 hover:shadow-emerald-500/15",
      }
    : {
        bg: "bg-gradient-to-b from-amber-500/[0.10] via-slate-900/90 to-slate-950/95",
        border: "border-t-amber-400/40 border-x-white/10 border-b-white/5 hover:border-amber-400/60",
        shadow: "shadow-md shadow-amber-950/40 hover:shadow-amber-500/15",
      };

  const buttonBaseClass = `group relative flex items-center gap-1.5 px-3 py-2 rounded-xl ${verdictLighting.bg} ${verdictLighting.border} ${verdictLighting.shadow} hover:brightness-110 active:scale-95 text-slate-200 hover:text-white text-xs font-medium transition-all backdrop-blur-md cursor-pointer`;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className || "justify-center my-6"}`}>
      {/* WhatsApp */}
      <button
        type="button"
        onClick={handleWhatsApp}
        className={buttonBaseClass}
        title="Compartir en WhatsApp"
      >
        <svg
          className="w-4 h-4 fill-emerald-400 group-hover:scale-110 transition-transform shrink-0"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
        <span>WhatsApp</span>
      </button>

      {/* Telegram */}
      <button
        type="button"
        onClick={handleTelegram}
        className={buttonBaseClass}
        title="Compartir en Telegram"
      >
        <svg
          className="w-3.5 h-3.5 fill-sky-400 group-hover:scale-110 transition-transform shrink-0"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
        </svg>
        <span>Telegram</span>
      </button>

      {/* Botón General de Compartir (Nativo para Instagram, Stories, Facebook, etc.) */}
      <button
        type="button"
        onClick={handleNativeShare}
        className={buttonBaseClass}
        title="Compartir en Instagram, redes o cualquier app"
      >
        <Share2 className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform shrink-0" />
        <span>Compartir</span>
      </button>

      {/* Copiar Resumen */}
      <button
        type="button"
        onClick={handleCopy}
        className={buttonBaseClass}
        title="Copiar resumen al portapapeles"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-emerald-300">¡Copiado!</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-colors shrink-0" />
            <span>Copiar resumen</span>
          </>
        )}
      </button>

      {/* X (Twitter) */}
      <button
        type="button"
        onClick={handleTwitter}
        className={buttonBaseClass}
        title="Compartir en X"
      >
        <svg
          className="w-3.5 h-3.5 fill-slate-400 group-hover:fill-white group-hover:scale-110 transition-all shrink-0"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        <span>X</span>
      </button>
    </div>
  );
}
