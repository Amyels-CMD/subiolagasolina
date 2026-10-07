import type { Metadata } from "next";
import "./globals.css";
import { NavbarHeader } from "@/components/NavbarHeader";
import { getBaseUrl } from "@/lib/utils/url";

const baseUrl = getBaseUrl();

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "SubióLaGasolina | Precios de Combustibles en República Dominicana",
    template: "%s | SubióLaGasolina",
  },
  description:
    "¿Subió la gasolina esta semana en RD? Consulta al instante los precios oficiales de Gasolina Premium, Regular, Gasoil, GLP y Gas Natural emitidos por el MICM, con histórico completo y gráficas interactivas.",
  keywords: [
    "precio gasolina rd",
    "precio gasolina hoy",
    "subio la gasolina",
    "precio combustible republica dominicana",
    "gasolina premium rd",
    "gasolina regular rd",
    "gasoil optimo rd",
    "precio glp rd",
    "micm precios combustibles",
    "combustibles rd",
  ],
  authors: [{ name: "SubióLaGasolina" }],
  creator: "SubióLaGasolina",
  publisher: "SubióLaGasolina",
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "¿Subió la gasolina en República Dominicana esta semana?",
    description:
      "Consulta los precios oficiales de combustibles vigentes según el MICM. Sin registros, rápido y con histórico completo.",
    url: baseUrl,
    siteName: "SubióLaGasolina",
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
        <meta name="theme-color" content="#080c14" />
      </head>
      <body className="bg-[#080c14] text-slate-100 flex flex-col min-h-screen">
        <NavbarHeader />
        <main className="flex-1">{children}</main>
        <footer className="w-full border-t border-white/10 bg-[#06090f] py-12 px-4 sm:px-6 mt-16 text-xs text-slate-400">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div>
              <p className="font-bold text-white text-sm">
                Subió<span className="text-blue-400">LaGasolina</span> 🇩🇴
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
                href="/api/prices"
                className="hover:text-blue-400 transition-colors font-mono"
              >
                API REST
              </a>
              <a
                href="/llms.txt"
                className="hover:text-blue-400 transition-colors font-mono"
              >
                llms.txt
              </a>
            </div>
          </div>
          <div className="max-w-6xl mx-auto text-center md:text-left text-slate-600 mt-6 pt-6 border-t border-white/5 text-[11px]">
            Los datos mostrados se basan en las resoluciones oficiales emitidas conforme a la Ley 112-00 de Hidrocarburos. No constituimos una entidad gubernamental oficial.
          </div>
        </footer>
      </body>
    </html>
  );
}
