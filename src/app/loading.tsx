import { Fuel } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4 animate-pulse">
        <Fuel className="w-8 h-8" />
      </div>
      <p className="text-sm font-semibold text-slate-300">
        Cargando precios oficiales de combustibles...
      </p>
      <span className="text-xs text-slate-500 mt-1">MICM • República Dominicana</span>
    </div>
  );
}
