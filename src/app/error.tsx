"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-6">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">
        Ocurrió un error al cargar los datos
      </h1>
      <p className="text-slate-400 text-xs sm:text-sm max-w-md mb-6">
        No pudimos procesar la información de combustibles en este momento. Intenta recargar la página.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Reintentar</span>
      </button>
    </div>
  );
}
