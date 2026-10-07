import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SubióLaGasolina - Precios de Combustibles en República Dominicana",
    short_name: "SubióLaGasolina",
    description:
      "Consulta al instante si subió, bajó o se mantuvo la gasolina en RD con precios oficiales del MICM e histórico completo.",
    start_url: "/",
    display: "standalone",
    background_color: "#080c14",
    theme_color: "#080c14",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
