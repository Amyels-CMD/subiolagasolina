import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "subiólagasolina - Precios de Combustibles en República Dominicana",
    short_name: "subiólagasolina",
    description:
      "Consulta al instante si subió, bajó o se mantuvo la gasolina en RD con precios oficiales del MICM e histórico completo.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b1120",
    theme_color: "#0b1120",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
