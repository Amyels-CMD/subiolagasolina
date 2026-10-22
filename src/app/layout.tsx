import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DominicanFlag } from "@/components/DominicanFlag";
import { getBaseUrl } from "@/lib/utils/url";
import { Analytics } from "@vercel/analytics/next";

const baseUrl = getBaseUrl();

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#080c14",
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "subiólagasolina | Precios de Combustibles en República Dominicana",
    template: "%s | subiólagasolina",
  },
  description:
    "¿Subió la gasolina esta semana en RD? Consulta al instante los precios oficiales de Gasolina Premium, Regular, Gasoil, GLP y Gas Natural emitidos por el MICM, con histórico completo y gráficas interactivas.",
  keywords: [
    "precio gasolina rd",
    "precio gasolina hoy",
    "subio la gasolina",
    "subiolagasolina",
    "precio combustible republica dominicana",
    "gasolina premium rd",
    "gasolina regular rd",
    "gasoil optimo rd",
    "precio glp rd",
    "micm precios combustibles",
    "combustibles rd",
  ],
  authors: [{ name: "subiólagasolina" }],
  creator: "subiólagasolina",
  publisher: "subiólagasolina",
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "¿Subió la gasolina en República Dominicana esta semana?",
    description:
      "Consulta los precios oficiales de combustibles vigentes según el MICM. Sin registros, rápido y con histórico completo.",
    url: baseUrl,
    siteName: "subiólagasolina",
    locale: "es_DO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "¿Subió la gasolina esta semana en RD?",
    description:
      "Precios oficiales de combustibles en República Dominicana según el MICM. Entérate en 1 segundo si subió, bajó o se mantuvo.",
  },
  alternates: {
    canonical: baseUrl,
    types: {
      "application/rss+xml": `${baseUrl}/feed.xml`,
      "application/feed+json": `${baseUrl}/feed.json`,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark scroll-smooth">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#0b1120" />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="subiólagasolina — Feed RSS de Precios"
          href="/feed.xml"
        />
        <link
          rel="alternate"
          type="application/feed+json"
          title="subiólagasolina — Feed JSON"
          href="/feed.json"
        />
      </head>
      <body className="bg-[#0b1120] text-slate-100 flex flex-col min-h-screen">
        <main className="flex-1 w-full min-w-0">{children}</main>
        <footer className="w-full border-t border-white/10 bg-[#06090f] py-12 px-4 sm:px-6 mt-16 text-xs text-slate-400">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div>
              <p className="font-bold text-white text-sm flex items-center gap-1.5 justify-center md:justify-start">
                <span>subiólagasolina</span>
                <DominicanFlag className="w-4 h-3 rounded-[1px] shadow-sm" />
              </p>
              <p className="text-slate-500 mt-1">
                La forma más simple y rápida de consultar combustibles en República Dominicana.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <a
                href="https://micm.gob.do"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-400 transition-colors"
              >
                Ministerio de Industria y Comercio (MICM)
              </a>
              <a
                href="https://datos.gob.do"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-400 transition-colors"
              >
                Portal Nacional de Datos Abiertos
              </a>
              <a
                href="#apoyar"
                className="hover:text-amber-300 text-amber-400 font-semibold transition-colors flex items-center gap-1"
              >
                <span>Invítame un galón ⛽</span>
              </a>
              <a
                href="/api/prices"
                className="hover:text-blue-400 transition-colors font-mono"
              >
                API REST
              </a>
            </div>
          </div>
          <div className="max-w-6xl mx-auto text-center md:text-left text-slate-600 mt-6 pt-6 border-t border-white/5 text-[11px]">
            Los datos mostrados se basan en las resoluciones oficiales emitidas conforme a la Ley 112-00 de Hidrocarburos. No constituimos una entidad gubernamental oficial.
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
