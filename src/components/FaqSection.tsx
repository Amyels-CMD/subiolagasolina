import React from "react";
import { HelpCircle } from "lucide-react";

export const FAQS = [
  {
    question: "¿Qué día y a qué hora cambian los precios de los combustibles en República Dominicana?",
    answer:
      "El Ministerio de Industria, Comercio y Mipymes (MICM) emite la resolución oficial cada viernes alrededor de la 1:00 PM (13:00 AST). Los nuevos precios entran en vigencia a las 00:00 horas del sábado y se mantienen hasta las 23:59 horas del viernes siguiente.",
  },
  {
    question: "¿Por qué el gobierno dominicano congela o subsidia los precios de los combustibles?",
    answer:
      "Conforme al Decreto 625-11 y las políticas de mitigación económica ante fluctuaciones del petróleo WTI y derivados en el Golfo de México, el Estado dominicano absorbe una porción de las alzas mediante subsidios directos para evitar que la inflación internacional afecte el transporte de pasajeros, de carga y la canasta básica familiar.",
  },
  {
    question: "¿Cómo se calculan oficialmente los precios según la Ley 112-00?",
    answer:
      "El Precio de Paridad de Importación (PPI) se fundamenta en la cotización promedio de los productos refinados en la Costa del Golfo de Estados Unidos, los fletes marítimos, seguros, márgenes de comercialización, transporte y los impuestos específicos y ad-valorem establecidos por la Ley 112-00 de Hidrocarburos y la Ley 557-05.",
  },
  {
    question: "¿Cuál es la diferencia entre Gasolina Premium y Regular?",
    answer:
      "La Gasolina Premium posee un octanaje mínimo de 95 Octanos (RON) con aditivos detergentes avanzados, recomendada para vehículos con alta relación de compresión o turbocargador. La Gasolina Regular cuenta con 89 Octanos (RON), adecuada para la mayoría de vehículos compactos y motocicletas estándar.",
  },
  {
    question: "¿De dónde provienen los datos mostrados en SubióLaGasolina?",
    answer:
      "Todos los datos son extraídos y procesados directamente desde las resoluciones públicas y el Portal Nacional de Datos Abiertos de la República Dominicana (datos.gob.do), gestionado por el Ministerio de Industria, Comercio y Mipymes (MICM).",
  },
];

export function FaqSection() {
  return (
    <section id="preguntas" className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
          <HelpCircle className="w-4 h-4" />
          <span>Guía para el Conductor Dominicano</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Preguntas Frecuentes
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Todo lo que necesitas saber sobre el cálculo y regulación de combustibles en RD
        </p>
      </div>

      <div className="space-y-4">
        {FAQS.map((faq, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-white/10 transition-colors"
          >
            <h3 className="text-base font-bold text-white mb-2">
              {faq.question}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              {faq.answer}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
