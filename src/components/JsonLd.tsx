import React from "react";
import { WeeklySummary } from "@/lib/types/fuel";
import { FAQS } from "@/components/FaqSection";
import { getBaseUrl } from "@/lib/utils/url";

interface JsonLdProps {
  summary: WeeklySummary;
}

export function JsonLd({ summary }: JsonLdProps) {
  const baseUrl = getBaseUrl();
  const { currentWeek, headlineVerdict, subVerdict } = summary;

  // 1. Dataset Schema
  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Precios Históricos y Actuales de Combustibles en República Dominicana",
    description:
      "Serie temporal de precios oficiales de Gasolina Premium, Regular, Gasoil, GLP y Gas Natural emitidos por el Ministerio de Industria, Comercio y Mipymes (MICM).",
    url: baseUrl,
    license: "https://datos.gob.do",
    creator: {
      "@type": "GovernmentOrganization",
      name: "Ministerio de Industria, Comercio y Mipymes (MICM)",
      url: "https://micm.gob.do",
    },
    temporalCoverage: "2020/2026",
    spatialCoverage: {
      "@type": "Place",
      name: "República Dominicana",
      geo: {
        "@type": "GeoCoordinates",
        latitude: "18.7357",
        longitude: "-70.1627",
      },
    },
    distribution: [
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: `${baseUrl}/api/prices?history=true`,
      },
    ],
  };

  // 2. Special Announcement Schema (for current fuel resolution)
  const announcementSchema = {
    "@context": "https://schema.org",
    "@type": "SpecialAnnouncement",
    name: `Aviso Oficial de Precios de Combustibles: ${currentWeek.dateLabel}`,
    text: `¿Subió la gasolina esta semana? ${headlineVerdict}. ${subVerdict} Gasolina Premium: RD$ ${currentWeek.prices["gasolina-premium"]}, Gasolina Regular: RD$ ${currentWeek.prices["gasolina-regular"]}, Gasoil Óptimo: RD$ ${currentWeek.prices["gasoil-optimo"]}, GLP: RD$ ${currentWeek.prices["glp"]}.`,
    datePosted: currentWeek.announcementDate,
    expires: currentWeek.endDate,
    announcementLocation: {
      "@type": "Country",
      name: "Dominican Republic",
    },
    provider: {
      "@type": "Organization",
      name: "SubióLaGasolina",
      url: baseUrl,
    },
  };

  // 3. FAQ Schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(announcementSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
