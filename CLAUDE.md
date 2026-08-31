# Crisbo Tattoo - Landing Page Editorial

## Descripcion
Landing page premium/editorial para Crisbo Tattoo, tatuador profesional en Bogota, Colombia. Especializado en Black & Grey, Realismo y proyectos personalizados. Diseno dark/editorial/cinematic.

## Stack Tecnologico
- **Framework**: Next.js 14 (App Router)
- **UI**: React 18 + Tailwind CSS
- **Animaciones**: CSS + IntersectionObserver (sin dependencias pesadas)
- **Iconos**: Lucide React

## Paleta de Colores
```
Negro carbon:     #0A0A0A (bg)
Negro secundario: #111111 (bg-secondary)
Blanco hueso:     #F1EFE9 (ink)
Gris:             #9B9B9B (ink-muted)
Verde oliva/sage: #A8B39A (sage) - SOLO como acento
Lineas:           #222222 (line)
```

## Tipografia
- **Headlines**: Anton (font-display) - Sans serif condensada gigante
- **Body**: Inter (font-body) - Sans serif limpia

## Estructura del Proyecto
```
app/
  layout.jsx      # Layout con metadata SEO y fuentes
  page.jsx        # Ensamble de componentes
  globals.css     # Estilos globales, grain, animaciones

components/
  Header.jsx      # Header sticky minimalista
  Hero.jsx        # Hero editorial con CRISBO gigante
  Ticker.jsx      # Banda verde sage animada
  About.jsx       # Seccion "01 / THE ARTIST"
  Process.jsx     # Proceso editorial 01-04
  SelectedWork.jsx# Proyectos seleccionados
  Sleeves.jsx     # Seccion mangas (fondo sage)
  Studio.jsx      # Seccion "03 / THE STUDIO"
  Testimonials.jsx# Resenas editoriales
  FAQ.jsx         # Preguntas frecuentes
  CTAFinal.jsx    # CTA impactante final
  Footer.jsx      # Footer editorial

public/
  images/         # Imagenes del sitio
```

## Comandos
```bash
npm run dev      # Servidor de desarrollo (localhost:3000)
npm run build    # Build de produccion
npm run start    # Servidor de produccion
```

## Funcionalidades Conservadas
- WhatsApp: https://wa.me/573202107769
- Instagram: @crisbotattoo
- Google Maps: https://share.google/qeywmW0E0sMJvThim
- Direccion: Cl. 137b #57b - 39, piso 2, Bogota
- Horario: Lunes a Sabado, 10:00 a.m. - 7:00 p.m.
- SEO optimizado para tatuador Bogota

## IMAGENES - PLACEHOLDERS A REEMPLAZAR

Las siguientes imagenes necesitan ser reemplazadas con fotografias profesionales:

### Hero
- `/images/hero-tattoo.jpg` → Foto profesional de CRISBO de pie, brazos cruzados o pose editorial

### About
- `/images/about.jpg` → Foto de Crisbo trabajando/tatuando

### Studio (seccion estudio)
- Foto principal estudio → Imagen grande del espacio
- Detalles estudio → Estacion de trabajo, ambiente

### Proyectos (SelectedWork)
- Se usan las imagenes existentes de especialidades
- Idealmente agregar mas proyectos destacados

## Notas de Desarrollo
- Sistema de animaciones con CSS + IntersectionObserver (clase `.reveal`)
- Mobile-first: disenado para 375px, 390px, 430px
- Sin framer-motion para reducir bundle (usar CSS transitions)
- Film grain sutil via SVG filter en `.grain`
- Ticker animado con CSS keyframes
- prefers-reduced-motion respetado

## Estilo Editorial
- Tipografia como elemento grafico principal
- Numeros de seccion: 01 / THE ARTIST, 02 / SELECTED WORK, etc.
- Mucho espacio negativo
- Composiciones asimetricas
- Labels en mayusculas tracking-wider
- Sin cards SaaS, sin glassmorphism
