import type { Metadata, Viewport } from "next";
import { Inter, Oswald, Orbitron, Anton, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { RegisterSW } from "@/components/shared/register-sw";
import { ThemeProvider } from "@/components/shared/theme-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-display",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-wordmark",
  weight: ["600", "700"],
  subsets: ["latin"],
});

const anton = Anton({
  variable: "--font-title",
  weight: "400",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OFINK — Gestión de proyectos de tatuaje",
  description:
    "Gestiona tus proyectos de tatuaje, de la cotización a la última sesión. Hecho para artistas.",
  applicationName: "OFINK",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "OFINK",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  // El visual viewport se "encoge" cuando aparece el teclado (en vez de
  // quedar tapado por él) — así cualquier campo o botón fijo/sticky al
  // fondo (inputs del bot, formularios, FormSheet) queda siempre arriba
  // del teclado, sin tocar la lógica de ningún formulario.
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      // Sin la clase `dark` fija: la pone `ThemeProvider` (next-themes) según
      // la preferencia guardada — por defecto arranca en oscuro (ver
      // theme-provider.tsx). suppressHydrationWarning: next-themes inserta
      // esa clase con un script antes de hidratar para evitar parpadeo;
      // eso hace que el className del server difiera del primer render del
      // cliente a propósito, y next-themes pide silenciar ese warning aquí.
      suppressHydrationWarning
      className={`${inter.variable} ${oswald.variable} ${orbitron.variable} ${anton.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* SplashScreen deshabilitado temporalmente (2026-07-21) para descartar
            que sea la causa de la pantalla en negro reportada en Inicio —
            si el bug persiste sin él, el problema es otro. Componente
            intacto en shared/splash-screen.tsx, solo falta des-comentar
            este import/uso para restaurarlo. */}
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
        <RegisterSW />
      </body>
    </html>
  );
}
