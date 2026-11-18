import React from "react";
import { ShieldCheck } from "lucide-react";
import { DominicanFlag } from "@/components/DominicanFlag";

export function NavbarHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#080c14]/85 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon-96.png"
            alt="subiólagasolina logo"
            width={40}
            height={40}
            className="rounded-xl border border-white/10 shadow-lg shadow-amber-500/10 shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-tight text-white">
                Subió<span className="text-blue-400">LaGasolina</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                <DominicanFlag className="w-3.5 h-2.5 rounded-[1px] shadow-sm" />
                <span>RD</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Precios oficiales de combustibles en República Dominicana
            </p>
          </div>
        </div>

        {/* Live official source badge & Navigation */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 live-pulse" />
            <span className="hidden sm:inline">Oficial MICM</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>

          <nav className="hidden md:flex items-center gap-4 text-xs font-medium text-slate-300">
            <a href="#precios" className="hover:text-white transition-colors">
              Precios
            </a>
            <a href="#grafica" className="hover:text-white transition-colors">
              Evolución
            </a>
            <a href="#calculadora" className="hover:text-white transition-colors">
              Calculadora
            </a>
            <a href="#historico" className="hover:text-white transition-colors">
              Histórico
            </a>
            <a href="#preguntas" className="hover:text-white transition-colors">
              Preguntas
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
