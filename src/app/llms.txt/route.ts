import { NextResponse } from "next/server";
import { getWeeklySummary } from "@/lib/services/fuel-service";
import { formatCurrency, formatDelta } from "@/lib/utils/format";

export async function GET() {
  const summary = getWeeklySummary();
  const { currentWeek, headlineVerdict, subVerdict, consumerItems } = summary;

  const content = `# SubióLaGasolina (República Dominicana)
> Consulta oficial en tiempo real de precios de combustibles según el Ministerio de Industria, Comercio y Mipymes (MICM).

## Estado de la Semana (${currentWeek.dateLabel})
- ¿Subió la gasolina?: ${headlineVerdict}
- Resumen: ${subVerdict}

## Precios Oficiales Vigentes
${consumerItems
  .map(
    (i) =>
      `- ${i.name}: ${formatCurrency(i.price)} por ${i.unit} (Variación: ${
        i.change === 0 ? "Sin cambios" : formatDelta(i.change)
      })`
  )
  .join("\n")}

## API Pública
Endpoint REST: https://subiolagasolina.com/api/prices
`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600",
    },
  });
}
