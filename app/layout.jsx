import "./globals.css";

export const metadata = {
  title: "Crisbo Tattoo | Tatuador en Bogotá — Black & Grey, Realismo, Blackwork",
  description:
    "Crisbo Tattoo, estudio de tatuajes en Bogotá especializado en Black & Grey, Realismo y Blackwork. Más de 9 años creando diseños exclusivos que cuentan tu historia.",
  keywords: [
    "tatuador Bogotá",
    "tatuajes Bogotá",
    "Crisbo Tattoo",
    "black and grey tattoo",
    "realismo tatuaje",
    "blackwork Bogotá",
  ],
  openGraph: {
    title: "Crisbo Tattoo | Tatuador en Bogotá",
    description:
      "Diseños exclusivos que cuentan tu historia. Black & Grey, Realismo y Blackwork en Bogotá, Colombia.",
    locale: "es_CO",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Permanent+Marker&family=Jost:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
