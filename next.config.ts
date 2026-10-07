import type { NextConfig } from "next";
import pkg from "./package.json";

const nextConfig: NextConfig = {
  // El build SÍ falla ante errores de tipos (2026-08-04). Antes estaba en
  // `ignoreBuildErrors: true` desde la etapa de maqueta, y eso dejó pasar dos
  // crashes reales a producción (formatDuration con ReferenceError, y el
  // cronómetro de sesión que nunca cerraba el turno). Se saldó la deuda de
  // tipos (de 92 a 0) y se reactivó la verificación — no volver a apagarla sin
  // dejar el typecheck en cero primero.
  typescript: { ignoreBuildErrors: false },
  // Versión visible en Ajustes → Acerca de OFINK (settings-hub). Sube sola con
  // cada deploy en Vercel: la versión sale de package.json y el build SHA lo
  // inyecta Vercel automáticamente (VERCEL_GIT_COMMIT_SHA) — no se edita a mano.
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
    NEXT_PUBLIC_BUILD_SHA: (process.env.VERCEL_GIT_COMMIT_SHA ?? "local").slice(0, 7),
  },
  experimental: {
    serverActions: {
      // Default 1 MB: las fotos de celular (2–8 MB) fallaban al subir a galería.
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // El navegador cachea sw.js por su cuenta (a veces hasta 24h) salvo que el
  // servidor diga explícitamente que no lo haga — sin esto, un deploy nuevo
  // puede tardar horas en notarse aunque el archivo ya cambió.
  async headers() {
    return [
      // Seguridad global (dominio propio ofink.co): mitiga clickjacking,
      // MIME-sniffing y fuga de referrer; fuerza HTTPS en el navegador.
      {
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(self)' },
          // CSP en modo REPORT-ONLY a propósito: no bloquea nada todavía, solo
          // reporta violaciones en la consola del navegador. Hacerla bloqueante
          // de una rompe el login de Google y el render de Satori.
          //
          // Cómo promoverla (cuando alguien pueda validar en un preview):
          //   1. Navegar la app completa (login Google, subir foto, generar PDF
          //      e imagen de cotización, firmar consentimiento, link público).
          //   2. Revisar la consola: cada violación reportada es algo que la
          //      política bloquearía de verdad. Ajustar las directivas.
          //   3. Cuando la consola quede limpia, renombrar esta clave a
          //      'Content-Security-Policy' (sin el -Report-Only).
          //
          // 'unsafe-inline'/'unsafe-eval' en script-src están porque Next inyecta
          // scripts inline para hidratación; se pueden quitar migrando a nonces.
          {
            key: 'Content-Security-Policy-Report-Only',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              "frame-src 'self' https://accounts.google.com",
              "worker-src 'self' blob:",
              "frame-ancestors 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
      // Assets de marca e íconos: no cambian entre deploys (y si cambian, se
      // renombra el archivo) — cachearlos un año evita re-descargarlos en cada
      // apertura y acelera el primer render del logo/splash.
      {
        source: "/brand/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/icons/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
