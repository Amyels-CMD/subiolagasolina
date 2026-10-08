import { getHistoryDescending } from "@/lib/services/fuel-service";
import { getBaseUrl } from "@/lib/utils/url";
import { formatCurrency } from "@/lib/utils/format";

export async function GET() {
  const baseUrl = getBaseUrl();
  const recentWeeks = getHistoryDescending().slice(0, 15);

  const feed = {
    version: "https://jsonfeed.org/version/1.1",
    title: "subiólagasolina — Precios de Combustibles en República Dominicana",
    home_page_url: baseUrl,
    feed_url: `${baseUrl}/feed.json`,
    description: "Actualizaciones semanales de precios oficiales de combustibles en RD según resoluciones del MICM.",
    language: "es-DO",
    authors: [
      {
        name: "subiólagasolina",
        url: baseUrl,
      },
    ],
    items: recentWeeks.map((week) => {
      const premium = formatCurrency(week.prices["gasolina-premium"]);
      const regular = formatCurrency(week.prices["gasolina-regular"]);
      const glp = formatCurrency(week.prices["glp"]);
      const optimo = formatCurrency(week.prices["gasoil-optimo"]);

      return {
        id: `subiolagasolina-${week.weekId}`,
        url: `${baseUrl}/#historico`,
        title: `Aviso MICM ${week.dateLabel}: Premium ${premium} | Regular ${regular} | GLP ${glp}`,
        content_text: `Precios oficiales para la semana del ${week.dateLabel}. Gasolina Premium: ${premium}, Gasolina Regular: ${regular}, Gasoil Óptimo: ${optimo}, GLP: ${glp}. Fuente oficial: MICM.`,
        date_published: new Date(week.announcementDate || week.startDate).toISOString(),
        tags: ["Combustibles", "República Dominicana", "MICM"],
      };
    }),
  };

  return new Response(JSON.stringify(feed, null, 2), {
    headers: {
      "Content-Type": "application/feed+json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}

