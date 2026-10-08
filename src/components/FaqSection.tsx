"use client";

import React, { useState } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";
import { FAQS } from "@/lib/constants/faqs";

export { FAQS };

export function FaqSection() {
  const [openIndexes, setOpenIndexes] = useState<number[]>([]); // All closed by default for a clean index

  const toggleIndex = (idx: number) => {
    setOpenIndexes((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <section id="preguntas" className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="text-left mb-8 pb-4 border-b border-white/10">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
          <HelpCircle className="w-4 h-4" />
          <span>Guía Oficial para el Conductor Dominicano</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight uppercase">
          Preguntas Frecuentes & Metodología
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
          Todo lo que necesitas saber sobre el cálculo oficial, días de vigencia según la Ley 112-00 y la regulación del MICM.
        </p>
      </div>

      {/* Flat Accordion List (Zero rounded card boxes! Border-line design like isaiprofitable.com) */}
      <div className="border-t border-white/10 divide-y divide-white/10">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndexes.includes(idx);
          return (
            <div key={idx} className="transition-colors">
              <button
                type="button"
                onClick={() => toggleIndex(idx)}
                aria-expanded={isOpen}
                className="w-full py-5 sm:py-6 flex items-center justify-between text-left gap-4 cursor-pointer group focus:outline-none"
              >
                <span className="text-sm sm:text-base md:text-lg font-bold text-white group-hover:text-blue-400 transition-colors leading-snug">
                  {faq.question}
                </span>
                <span className="p-1 rounded-md text-slate-400 group-hover:text-white shrink-0 transition-transform duration-300">
                  <ChevronDown
                    className={`w-5 h-5 transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-blue-400" : ""
                    }`}
                  />
                </span>
              </button>

              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  isOpen ? "grid-rows-[1fr] opacity-100 pb-6" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="text-xs sm:text-sm md:text-base text-slate-200 leading-relaxed font-normal pl-0 sm:pl-2">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
