import "./globals.css";

export const metadata = {
  title: "Crisbo Tattoo | Tatuador en Bogota - Black & Grey, Realismo, Custom Projects",
  description:
    "Crisbo Tattoo - Tatuador profesional en Bogota especializado en Black & Grey, Realismo y proyectos personalizados. Mas de 9 anos de experiencia creando disenos exclusivos que cuentan tu historia. Colina Campestre, Bogota.",
  keywords: [
    "tatuador Bogota",
    "tatuajes Bogota",
    "Crisbo Tattoo",
    "black and grey Bogota",
    "realismo tatuaje Bogota",
    "tatuajes realismo",
    "mangas tatuaje Bogota",
    "tatuador profesional Bogota",
    "tatuajes personalizados",
    "custom tattoo Bogota",
    "Colina Campestre tatuajes",
  ],
  authors: [{ name: "Crisbo Tattoo" }],
  creator: "Crisbo Tattoo",
  openGraph: {
    title: "Crisbo Tattoo | Tatuador en Bogota",
    description:
      "Disenos exclusivos que cuentan tu historia. Black & Grey, Realismo y proyectos personalizados en Bogota, Colombia.",
    locale: "es_CO",
    type: "website",
    siteName: "Crisbo Tattoo",
  },
  twitter: {
    card: "summary_large_image",
    title: "Crisbo Tattoo | Tatuador en Bogota",
    description:
      "Disenos exclusivos que cuentan tu historia. Black & Grey, Realismo y proyectos personalizados en Bogota, Colombia.",
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
  themeColor: "#0A0A0A",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
