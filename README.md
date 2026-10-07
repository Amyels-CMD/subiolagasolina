# SubióLaGasolina ⛽🇩🇴

> **¿Subió la gasolina esta semana en República Dominicana?**  
> Producto web público ultraligero, rápido y visualmente atractivo para consultar al instante los precios oficiales de combustibles en RD, variaciones semanales, histórico oficial y gráficas interactivas.

Inspirado en la filosofía visual y de presentación de datos de **isaiprofitable.com** (jerarquía directa, números gigantes, tarjetas limpias, tipografía nítida y sensación de producto de datos), adaptado al público general dominicano.

---

## 🚀 Características Principales

- **Respuesta Instantánea (Verdict Hero):** Responde en 1 segundo a la pregunta clave: **"NO, SE MANTUVO"**, **"¡BAJÓ!"** o **"SÍ, SUBIÓ"**, con el detalle de si el gobierno aplicó subsidios extraordinarios.
- **Precios de Consumo Masivo:** Tarjetas con números grandes para:
  - Gasolina Premium (`RD$ 353.10 / gal`)
  - Gasolina Regular (`RD$ 317.50 / gal`)
  - Gasoil Óptimo (`RD$ 306.10 / gal`)
  - Gasoil Regular (`RD$ 270.80 / gal`)
  - GLP (`RD$ 135.20 / gal`)
  - Gas Natural GNV (`RD$ 43.97 / m³`)
- **Combustibles Industriales y de Aviación:** Panel colapsable para Avtur, Kerosene, Fuel Oíl #6 y Fuel Oíl 1%S.
- **Contador Regresivo en Vivo:** Muestra exactamente el tiempo restante para la próxima resolución oficial del Ministerio de Industria, Comercio y Mipymes (MICM), emitida cada **viernes a la 1:00 PM AST**.
- **Curva de Evolución Histórica:** Gráfica interactiva SVG con selectores de período (4 semanas, 12 semanas, 6 meses, Año 2026, Histórico completo) y chips por tipo de combustible con tooltip dinámico y crosshair.
- **Calculadora de Llenado de Tanque:** Selecciona tu combustible y vehículo (Sedán 10-13 gal, SUV 17 gal, Pickup 22 gal, Cilindro GLP 25/50/100 lb) para saber de inmediato cuánto te cuesta llenar hoy y la diferencia vs la semana pasada.
- **Historial Completo y Descarga:** Tabla de resoluciones semanales desde 2020 con buscador y botón de descarga directa en **CSV**.
- **Compartir en 1 Clic:** Botón directo para compartir el resumen formateado con emojis en **WhatsApp** y en **X (Twitter)**.
- **SEO Técnico & GEO/AEO:**
  - Metadatos Open Graph y Twitter Cards.
  - JSON-LD con esquemas Schema.org: `SpecialAnnouncement`, `Dataset` y `FAQPage`.
  - Archivos dinámicos: `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest` (PWA) y `/llms.txt`.

---

## 🛠️ Stack Tecnológico

- **Framework:** Next.js 16 (App Router con Turbopack)
- **Lenguaje:** TypeScript 5.9
- **Estilos:** Tailwind CSS v4 con variables CSS nativas y diseño de alto contraste (dark mode por defecto)
- **Componentes & Iconos:** React 19, Lucide React
- **Testing:** Node.js native test runner con `tsx` (9 tests ejecutados en sub-segundo)
- **Despliegue:** Optimizado para Vercel con Vercel Cron

---

## 📡 Pipeline de Ingesta y Persistencia de Datos

1. **Fuente Oficial:** Consume el conjunto de datos de precios de combustibles del **Ministerio de Industria, Comercio y Mipymes (MICM)** y del **Portal Nacional de Datos Abiertos (datos.gob.do)**.
2. **Persistencia Local (`src/data/fuel-history.json`):** Almacena 357+ semanas de resoluciones oficiales para garantizar:
   - Cero latencia en visitas de usuarios.
   - Disponibilidad 100% incluso si el portal oficial está fuera de servicio o en mantenimiento.
   - Gráficas históricas fluidas sin dependencias de bases de datos externas.
3. **Automatización:**
   - Endpoint `/api/sync`: Verifica e incorpora nuevas semanas automáticamente.
   - Endpoint `/api/cron`: Diseñado para ejecutarse vía Vercel Cron cada viernes a las 1:15 PM AST (`15 17 * * 5` UTC).
   - API pública en `/api/prices` con cabeceras de caché CDN (`s-maxage=3600`).

---

## 📂 Estructura del Proyecto

```
subiolagasolina/
├── scripts/
│   └── generate-history.mjs   # Script de extracción y compilación del histórico MICM
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── cron/route.ts  # Endpoint de cron Vercel
│   │   │   ├── prices/route.ts# API REST pública de precios e histórico
│   │   │   └── sync/route.ts  # Endpoint de sincronización con MICM
│   │   ├── icon.tsx           # Favicon dinámico (ImageResponse)
│   │   ├── manifest.ts        # PWA Web App Manifest
│   │   ├── robots.ts          # Robots.txt con soporte para motores y AI bots
│   │   ├── sitemap.ts         # Sitemap dinámico
│   │   ├── llms.txt/route.ts  # Resumen legible para modelos de lenguaje
│   │   ├── globals.css        # Sistema de diseño, tokens y modo oscuro
│   │   ├── layout.tsx         # Layout raíz con metadatos SEO y JSON-LD
│   │   └── page.tsx           # Portada principal SubióLaGasolina
│   ├── components/
│   │   ├── CountdownTimer.tsx # Contador regresivo para el viernes 1:00 PM AST
│   │   ├── EvolutionChart.tsx # Gráfica interactiva de precios
│   │   ├── FaqSection.tsx     # Preguntas frecuentes y guía para conductores
│   │   ├── FuelCardsGrid.tsx  # Tarjetas de precios actuales con variaciones
│   │   ├── HeroVerdict.tsx    # Veredicto visual principal (estilo isaiprofitable)
│   │   ├── HistoricalTable.tsx# Tabla de semanas pasadas con buscador y CSV
│   │   ├── JsonLd.tsx         # Schema.org structured data
│   │   ├── NavbarHeader.tsx   # Barra superior con estado en vivo
│   │   ├── ShareButtons.tsx   # Botones para WhatsApp y X
│   │   └── TankCalculator.tsx # Calculadora de tanque
│   ├── data/
│   │   └── fuel-history.json  # Base de datos histórica persistida
│   ├── lib/
│   │   ├── constants/fuels.ts # Metadatos de combustibles y colores
│   │   ├── services/
│   │   │   ├── fuel-service.ts# Lógica de cálculo, deltas y resúmenes
│   │   │   └── ingestion.ts   # Ingesta automatizada y fallback
│   │   ├── types/fuel.ts      # Tipos TypeScript
│   │   └── utils/
│   │       ├── date-rd.ts     # Manejo de zona horaria AST (UTC-4)
│   │       ├── format.ts      # Formateadores monetarios y porcentajes
│   │       └── url.ts         # Resolución de URLs canónicas para Vercel
│   └── tests/
│       └── fuel-service.test.ts # Pruebas unitarias
├── vercel.json                # Configuración de cron jobs para Vercel
└── package.json
```

---

## 💻 Desarrollo Local

```bash
# 1. Instalar dependencias
npm install

# 2. Ejecutar suite de pruebas
npm test

# 3. Compilar producción
npm run build

# 4. Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 🌐 Despliegue en Vercel

El proyecto está listo para despliegue directo en **Vercel**:
1. Conecta el repositorio en el panel de Vercel.
2. Framework Preset: **Next.js**.
3. (Opcional) Configura la variable de entorno `CRON_SECRET` si deseas proteger la ejecución de `/api/cron`.
4. Despliega con 1 clic. El archivo `vercel.json` configurará automáticamente la tarea cron para los viernes a la 1:15 PM AST.
