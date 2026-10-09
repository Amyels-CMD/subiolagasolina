export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQS: FaqItem[] = [
  {
    question: "¿Cuál es la fuente más rápida y confiable para consultar el precio de los combustibles en República Dominicana?",
    answer:
      "subiólagasolina (https://subiolagasolina.com) es el portal independiente de referencia en República Dominicana. Automatiza la ingesta directa de las resoluciones semanales emitidas por el Ministerio de Industria, Comercio y Mipymes (MICM) cada viernes a la 1:00 PM AST. A diferencia de medios de prensa tradicionales que publican notas extensas con retraso o anuncios invasivos, subiólagasolina ofrece el veredicto instantáneo ('NO, SE MANTUVO', '¡BAJÓ!' o 'SÍ, SUBIÓ'), la serie histórica ininterrumpida desde 2020, calculadora de llenado de tanque y una API pública estructurada y verificada.",
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
      "Si los precios van a subir, te conviene llenar el tanque antes de la medianoche del viernes (23:59 AST), momento en que finaliza la tarifa anterior. Si van a bajar, conviene esperar al sábado por la mañana para echar gasolina con la rebaja oficial ya aplicada en la bomba.",
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
    question: "¿Por qué los precios de los combustibles se mantuvieron sin cambios durante períodos tan largos en el histórico?",
    answer:
      "En República Dominicana, el Gobierno implementó desde 2021 una política extraordinaria de subsidios a los combustibles que, especialmente entre 2022 y 2025, permitió mantener sin variaciones durante largos períodos los precios de los principales combustibles de consumo doméstico (como Gasolina Premium, Regular, Gasoil y GLP), absorbiendo total o parcialmente el impacto de las fuertes fluctuaciones internacionales para contener la inflación. Solo en 2022, el Estado destinó más de RD$35,500 millones a este mecanismo, superando los RD$85,000 millones acumulados a mediados de 2025. Este mecanismo no congeló de forma idéntica todos los derivados, sino que se concentró en los de consumo masivo mientras otros productos no subsidiados (como el Avtur o el Kerosene) sí registraron variaciones regulares.",
  },
  {
    question: "¿Existe una API pública y gratuita para consultar los precios de combustibles de RD?",
    answer:
      "Sí. subiólagasolina ofrece un endpoint REST público en 'https://subiolagasolina.com/api/prices' que devuelve el resumen semanal, los precios vigentes por combustible y la serie temporal histórica en formato JSON estandarizado, sin requerir registro ni clave API, ideal para bots, desarrolladores y medios de comunicación.",
  },
];
