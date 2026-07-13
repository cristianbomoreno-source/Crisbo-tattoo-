# Crisbo Tattoo — Landing Page

Landing page premium para el estudio de tatuajes **Crisbo Tattoo** (Bogotá, Colombia),
construida con Next.js 14 (App Router), Tailwind CSS, Framer Motion y Lucide Icons.

## Cómo correrlo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Para producción:

```bash
npm run build
npm run start
```

## Estructura

```
app/
  layout.jsx      -> metadata SEO, fuentes
  page.jsx         -> ensambla todas las secciones
  globals.css       -> paleta, grid blueprint, texturas
components/
  Navbar.jsx        -> sticky, blur al hacer scroll, menú móvil
  Hero.jsx           -> foto real del tatuador + animaciones de entrada
  Benefits.jsx        -> 4 tarjetas de beneficios
  About.jsx            -> sección "Sobre mí"
  Specialties.jsx       -> grid de 6 especialidades (placeholders)
  Process.jsx            -> 5 pasos del proceso de trabajo
  Testimonials.jsx        -> 3 testimonios
  FAQ.jsx                  -> acordeón
  CTA.jsx                   -> bloque final + FAQ
  Footer.jsx                 -> contacto, ubicación, horario, redes
public/images/
  hero-tattoo.jpg            -> foto real usada en el Hero
```

## Pendientes para dejarlo 100% listo

1. **Testimonios**: reemplaza los nombres/textos de ejemplo en
   `Testimonials.jsx` por reseñas reales de clientes.
2. **Video "Sobre mí"**: el botón de play en `About.jsx` es decorativo; puedes
   conectarlo a un modal de video o a un embed de YouTube/Vimeo.
3. **Dominio / SEO**: agrega tu dominio en `openGraph` dentro de `app/layout.jsx`
   y una imagen `og:image` si quieres previsualización enriquecida al compartir.

Ya están integrados: tu logo real, la foto del hero, la foto de "Sobre mí",
las 6 fotos de la galería de especialidades, tu número de WhatsApp
(+57 320 210 7769), tu dirección (Cl. 137b #57b - 39, piso 2, Bogotá) y el
enlace a tu perfil de Google Maps en el footer.

## Notas técnicas

- Todas las animaciones usan Framer Motion con `whileInView` (reveal al hacer
  scroll) y `prefers-reduced-motion` respetado globalmente en `globals.css`.
- La paleta de color vive en `tailwind.config.js` (`bg`, `bg-secondary`,
  `bg-grey`, `ink`, `gold`, `gold-2`, `line`) — cámbiala ahí si necesitas
  ajustar tonos.
- Tipografías: Bebas Neue (display), Permanent Marker (brush/"Tattoo"), Jost
  (cuerpo) — cargadas vía Google Fonts en `app/layout.jsx`.
