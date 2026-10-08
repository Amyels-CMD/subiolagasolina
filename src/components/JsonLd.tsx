import React from "react";
import { WeeklySummary } from "@/lib/types/fuel";
import { FAQS } from "@/lib/constants/faqs";
import { getBaseUrl } from "@/lib/utils/url";

interface JsonLdProps {
  summary: WeeklySummary;
}

export function JsonLd({ summary }: JsonLdProps) {
  const baseUrl = getBaseUrl();
  const { currentWeek, headlineVerdict, subVerdict } = summary;

  // 1. Dataset Schema (Compatible with Google Dataset Search)
  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": `${baseUrl}/#dataset`,
    name: "Precios Históricos y Actuales de Combustibles en República Dominicana",
    description:
      "Serie temporal y boletín vigente de precios oficiales de Gasolina Premium, Regular, Gasoil Óptimo, Gasoil Regular, GLP, Gas Natural y derivados emitidos por el Ministerio de Industria, Comercio y Mipymes (MICM).",
    url: baseUrl,
    license: "https://datos.gob.do",
    creator: {
      "@type": "GovernmentOrganization",
      name: "Ministerio de Industria, Comercio y Mipymes (MICM)",
      url: "https://micm.gob.do",
    },
    publisher: {
      "@type": "Organization",
      name: "subiólagasolina",
      url: baseUrl,
      logo: `${baseUrl}/icon`,
    },
    temporalCoverage: "2020/..",
    spatialCoverage: {
      "@type": "Place",
      name: "República Dominicana",
      geo: {
        "@type": "GeoCoordinates",
        latitude: "18.7357",
        longitude: "-70.1627",
      },
    },
    dateModified: currentWeek.announcementDate,
    measurementTechnique:
      "Resolución semanal emitida por el Ministerio de Industria, Comercio y Mipymes (MICM) conforme a la Ley 112-00 de Hidrocarburos y el Decreto 307-01.",
    keywords: [
      "precio gasolina rd",
      "precio gasolina hoy republica dominicana",
      "gasolina premium rd",
      "gasolina regular rd",
      "gasoil optimo rd",
      "precio glp rd",
      "combustibles micm",
      "subio la gasolina",
      "dataset precios combustibles rd",
    ],
    variableMeasured: [
      "Precio Gasolina Premium (RD$ por galón)",
      "Precio Gasolina Regular (RD$ por galón)",
      "Precio Gasoil Óptimo (RD$ por galón)",
      "Precio Gasoil Regular (RD$ por galón)",
      "Precio GLP (RD$ por galón)",
      "Precio Gas Natural (RD$ por m³)",
      "Precio Avtur (RD$ por galón)",
      "Precio Kerosene (RD$ por galón)",
      "Precio Fuel Oil #6 (RD$ por galón)",
      "Precio Fuel Oil 1%S (RD$ por galón)",
      "Crudo WTI de Referencia Internacional (USD por barril)",
    ],
    distribution: [
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: `${baseUrl}/api/prices?history=true`,
      },
      {
        "@type": "DataDownload",
        encodingFormat: "application/rss+xml",
        contentUrl: `${baseUrl}/feed.xml`,
      },
      {
        "@type": "DataDownload",
        encodingFormat: "application/feed+json",
        contentUrl: `${baseUrl}/feed.json`,
      },
    ],
  };

  // 2. WebSite Schema
  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    name: "subiólagasolina",
    url: baseUrl,
    description:
      "La forma más simple y rápida de consultar si subieron los precios oficiales de combustibles en República Dominicana.",
    inLanguage: "es-DO",
    publisher: {
      "@type": "Organization",
      name: "subiólagasolina",
      url: baseUrl,
      logo: `${baseUrl}/icon`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/api/prices?fuel={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  // 3. Special Announcement Schema (for current fuel resolution)
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
      name: "subiólagasolina",
      url: baseUrl,
    },
  };

  // 4. FAQ Schema
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

  // 5. WebPage with Speakable Specification (Google Assistant / Voice Search)
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "¿Subió la gasolina en República Dominicana esta semana?",
    url: baseUrl,
    inLanguage: "es-DO",
    description: `Consulta oficial en tiempo real de combustibles en RD. ${headlineVerdict}. ${subVerdict}`,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["#veredicto-principal", "#resumen-rapido"],
    },
    publisher: {
      "@type": "Organization",
      name: "subiólagasolina",
      url: baseUrl,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(announcementSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
    </>
  );
}
