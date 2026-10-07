import Link from "next/link";
import { Fuel, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6">
        <Fuel className="w-8 h-8" />
      </div>
      <h1 className="text-4xl sm:text-5xl font-black text-white mb-3">404</h1>
      <p className="text-slate-400 text-sm max-w-md mb-8">
        La página o resolución que buscas no fue encontrada. Consulta los precios oficiales en la portada principal.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a SubióLaGasolina</span>
      </Link>
    </div>
  );
}
