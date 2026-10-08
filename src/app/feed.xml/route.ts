import { getHistoryDescending } from "@/lib/services/fuel-service";
import { getBaseUrl } from "@/lib/utils/url";
import { formatCurrency } from "@/lib/utils/format";

export async function GET() {
  const baseUrl = getBaseUrl();
  const recentWeeks = getHistoryDescending().slice(0, 15);

  const rssItems = recentWeeks
    .map((week) => {
      const pubDate = new Date(week.announcementDate || week.startDate).toUTCString();
      const premium = formatCurrency(week.prices["gasolina-premium"]);
      const regular = formatCurrency(week.prices["gasolina-regular"]);
      const glp = formatCurrency(week.prices["glp"]);
      const optimo = formatCurrency(week.prices["gasoil-optimo"]);

      const title = `Aviso MICM ${week.dateLabel}: Premium ${premium} | Regular ${regular} | GLP ${glp}`;
      const description = `Precios oficiales de combustibles en República Dominicana para la semana del ${week.dateLabel} según resolución oficial del MICM. Gasolina Premium: ${premium}, Gasolina Regular: ${regular}, Gasoil Óptimo: ${optimo}, Gas Licuado de Petróleo (GLP): ${glp}.`;

      return `    <item>
      <title><![CDATA[${title}]]></title>
      <link>${baseUrl}/#historico</link>
      <guid isPermaLink="false">subiolagasolina-${week.weekId}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${description}]]></description>
      <category>Combustibles</category>
      <category>República Dominicana</category>
    </item>`;
    })
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>subiólagasolina — Precios de Combustibles en República Dominicana</title>
    <link>${baseUrl}</link>
    <description>Boletín semanal oficial de precios de combustibles emitidos por el Ministerio de Industria, Comercio y Mipymes (MICM).</description>
    <language>es-DO</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
${rssItems}
  </channel>
</rss>`;

  return new Response(rss.trim(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}

