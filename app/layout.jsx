import "./globals.css";

export const metadata = {
  title: "RIFA Crisbo Tattoo | Gana un Tatuaje de $1M + Boleta Ryan Castro",
  description:
    "Participa en la rifa de Crisbo Tattoo. Gana un tatuaje valorado en $1,000,000 COP + una boleta para el concierto de Ryan Castro. Solo 200 cupos a $30,000 cada uno. Sorteo 24 de octubre 2026.",
  keywords: [
    "rifa tatuaje Bogota",
    "rifa Crisbo Tattoo",
    "ganar tatuaje gratis",
    "sorteo tatuaje Colombia",
    "Ryan Castro concierto",
    "tatuaje black and grey",
    "rifa Colombia",
    "tatuador Bogota",
  ],
  authors: [{ name: "Crisbo Tattoo" }],
  creator: "Crisbo Tattoo",
  openGraph: {
    title: "RIFA Crisbo Tattoo | Tatuaje $1M + Boleta Ryan Castro",
    description:
      "200 cupos, $30,000 cada uno. Gana un tatuaje de $1M + boleta para Ryan Castro. Sorteo 24 de octubre 2026 con la Loteria de Colombia.",
    locale: "es_CO",
    type: "website",
    siteName: "Crisbo Tattoo",
  },
  twitter: {
    card: "summary_large_image",
    title: "RIFA Crisbo Tattoo | Tatuaje $1M + Boleta Ryan Castro",
    description:
      "200 cupos, $30,000 cada uno. Gana un tatuaje de $1M + boleta para Ryan Castro. Sorteo 24 de octubre 2026.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://crisbotattoo.com",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#070707",
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Gothic/Blackletter para títulos principales */}
        <link
          href="https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&display=swap"
          rel="stylesheet"
        />
        {/* Display fuerte para secundarios */}
        <link
          href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Body legible */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
