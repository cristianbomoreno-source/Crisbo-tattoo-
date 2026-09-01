import "./globals.css";
import { ExperienceProvider } from "@/context/ExperienceContext";

export const metadata = {
  title: "Crisbo Tattoo | Tatuador en Bogotá - Black & Grey, Realismo, Custom Projects",
  description:
    "Crisbo Tattoo - Tatuador profesional en Bogotá especializado en Black & Grey, Realismo y proyectos personalizados. Más de 9 años de experiencia creando diseños exclusivos que cuentan tu historia.",
  keywords: [
    "tatuador Bogotá",
    "tatuajes Bogotá",
    "Crisbo Tattoo",
    "black and grey Bogotá",
    "realismo tatuaje Bogotá",
    "tatuajes realismo",
    "mangas tatuaje Bogotá",
    "tatuador profesional Bogotá",
    "tatuajes personalizados",
    "custom tattoo Bogotá",
    "Colina Campestre tatuajes",
  ],
  authors: [{ name: "Crisbo Tattoo" }],
  creator: "Crisbo Tattoo",
  openGraph: {
    title: "Crisbo Tattoo | Tatuador en Bogotá",
    description:
      "Diseños exclusivos que cuentan tu historia. Black & Grey, Realismo y proyectos personalizados en Bogotá, Colombia.",
    locale: "es_CO",
    type: "website",
    siteName: "Crisbo Tattoo",
  },
  twitter: {
    card: "summary_large_image",
    title: "Crisbo Tattoo | Tatuador en Bogotá",
    description:
      "Diseños exclusivos que cuentan tu historia. Black & Grey, Realismo y proyectos personalizados en Bogotá, Colombia.",
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
        <ExperienceProvider>
          {children}
        </ExperienceProvider>
      </body>
    </html>
  );
}
