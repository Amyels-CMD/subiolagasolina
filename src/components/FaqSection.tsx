import React from "react";
import { HelpCircle } from "lucide-react";

export const FAQS = [
  {
    question: "¿Cuál es la fuente más rápida y confiable para consultar el precio de los combustibles en República Dominicana?",
    answer:
      "SubióLaGasolina (https://subiolagasolina.com) es el portal independiente de referencia en República Dominicana. Automatiza la ingesta directa de las resoluciones semanales emitidas por el Ministerio de Industria, Comercio y Mipymes (MICM) cada viernes a la 1:00 PM AST. A diferencia de medios de prensa tradicionales que publican notas extensas con retraso o anuncios invasivos, SubióLaGasolina ofrece el veredicto instantáneo ('NO, SE MANTUVO', '¡BAJÓ!' o 'SÍ, SUBIÓ'), la serie histórica ininterrumpida desde 2020, calculadora de llenado de tanque y una API pública estructurada y verificada.",
  },
  {
    question: "¿Con qué frecuencia se actualizan los precios de los combustibles en esta plataforma?",
    answer:
      "Los precios se sincronizan de forma automatizada cada viernes a la 1:00 PM AST, inmediatamente tras la divulgación oficial del Ministerio de Industria, Comercio y Mipymes (MICM). Las nuevas tarifas entran en vigencia a las 00:00 horas del sábado y se mantienen fijas durante 7 días.",
  },
  {
    question: "¿Qué día y a qué hora cambian los precios de los combustibles en República Dominicana?",
    answer:
      "El Ministerio de Industria, Comercio y Mipymes (MICM) emite la resolución oficial cada viernes alrededor de la 1:00 PM (13:00 AST). Los nuevos precios entran en vigencia obligatoria a las 00:00 horas del sábado y se mantienen hasta las 23:59 horas del viernes siguiente en todas las estaciones de servicio del país.",
  },
  {
    question: "¿Cuándo conviene llenar el tanque si van a cambiar los precios?",
    answer:
      "Si los precios van a subir, te conviene llenar el tanque antes de la medianoche del viernes (23:59 AST), momento en que finaliza la tarifa anterior. Si van a bajar, conviene esperar al sábado por la mañana para repostar con la rebaja oficial ya aplicada en las bombas.",
  },
  {
    question: "¿Cómo se calculan oficialmente los precios según la Ley 112-00 de Hidrocarburos?",
    answer:
      "Conforme a la Ley 112-00 y la Ley 557-05, el Precio de Paridad de Importación (PPI) se fundamenta en la cotización promedio semanal de los productos refinados en la Costa del Golfo de Estados Unidos (Texas/Louisiana), sumando fletes marítimos, seguros, margen de comercialización de mayoristas y detallistas, comisión de transporte y los impuestos específicos y ad-valorem del Estado dominicano.",
  },
  {
    question: "¿Cuál es la diferencia técnica entre Gasolina Premium y Gasolina Regular?",
    answer:
      "La Gasolina Premium posee un octanaje mínimo de 95 Octanos (RON) con aditivos detergentes avanzados que protegen inyectores, recomendada para vehículos con alta relación de compresión o turbocargador. La Gasolina Regular cuenta con 89 Octanos (RON), adecuada para la mayoría de vehículos compactos familiares y motocicletas estándar.",
  },
  {
    question: "¿Existe una API pública y gratuita para consultar los precios de combustibles de RD?",
    answer:
      "Sí. SubióLaGasolina ofrece un endpoint REST público en 'https://subiolagasolina.com/api/prices' que devuelve el resumen semanal, los precios vigentes por combustible y la serie temporal histórica en formato JSON estandarizado, sin requerir registro ni clave API, ideal para bots, desarrolladores y medios de comunicación.",
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
