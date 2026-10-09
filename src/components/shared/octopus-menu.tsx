'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Zap, FileText, Users, CalendarDays } from 'lucide-react'
import {
  actionById,
  readOctopusSlots,
  DEFAULT_OCTOPUS_SLOTS,
  DEFAULT_OCTOPUS_SLOTS_ESTUDIO,
  OCTOPUS_CONFIG_EVENT,
  type OctopusAction,
} from '@/lib/octopus-actions'

/**
 * OctopusMenu — la interfaz-pulpo de OFINK.
 *
 * REDISEÑO (premium, flat, sin ilustración): el pulpo ya no es un círculo
 * de cabeza separado del botón — el propio botón disparador (siempre el
 * mismo círculo verde) ES la cabeza. Al abrir, su ícono se desvanece y
 * aparece la foto del tatuador en su lugar (crossfade, dentro del MISMO
 * botón, sin agregar una segunda forma que compita visualmente). Los
 * cuatro tentáculos nacen de detrás de ese botón — una sola pieza, sin
 * cortes — y cada uno termina exactamente en el centro de su botón de
 * acceso (geometría resuelta analíticamente: el punto final de la curva
 * bézier de cada brazo, tras su rotación, cae exactamente sobre el centro
 * del botón correspondiente — no es una aproximación visual). El botón
 * (opaco, encima) tapa el tramo final del tentáculo, dando la sensación
 * de que "entra" al círculo y lo abraza, en vez de quedar pegado encima.
 *
 * Color: un solo verde de marca (`--primary`) con variaciones de
 * luminosidad muy sutiles para dar volumen — nada de degradados
 * multicolor ni brillos exagerados. Un glow verde suave y difuso detrás
 * de todo aporta la única "puesta en escena".
 *
 * Piezas internas (todas comparten el mismo estado `open` y la misma
 * secuencia de springs — ninguna flota de forma independiente):
 *   - Glow          → resplandor difuso detrás de todo (profundidad).
 *   - TriggerButton  → el botón/cabeza: siempre visible, hace crossfade
 *                      de ícono a foto.
 *   - TentacleShape  → los 4 brazos, geometría calculada para terminar
 *                      exactamente en su botón.
 *   - ActionButtons  → los 4 botones, en arco superior (no alineados).
 *
 * NOTA TÉCNICA (bug real, ya corregido): todo el centrado usa `left-1/2`
 * explícito + `marginLeft` negativo. NUNCA combinar eso con un padre
 * `flex justify-center` — un hijo `absolute` sin `left`/`right` propios
 * YA se centra solo dentro de un padre flex con `justify-center`, así que
 * sumarle además un `marginLeft` de centrado duplica el corrimiento y
 * termina desplazando todo hacia la izquierda (así se manifestó este bug
 * la primera vez). Se verificó con un render aislado (Playwright +
 * Chromium) antes de aplicar el fix.
 */


/** Geometría de la barra inferior (ver mobile-nav.tsx): estilo Instagram,
 * pegada al borde inferior (offset 0), 64px de alto de contenido (el
 * safe-area es padding interno de la barra). El botón-núcleo (84px)
 * sobresale la mitad por encima del borde superior de la barra. */
const BAR_OFFSET = 0 // px — la barra va pegada al borde inferior
const BAR_H = 64 // px — alto del contenido de la barra
const TRIGGER_SIZE = 84 // px — diámetro del núcleo

/** Pivote de la criatura: el centro del núcleo, sobre el borde superior
 * de la barra. Tentáculos y botones de acción comparten este pivote, así
 * que los brazos nacen exactamente detrás del núcleo. */
const PIVOT_BOTTOM = `calc(env(safe-area-inset-bottom) + ${BAR_OFFSET + BAR_H}px)`
const TRIGGER_BOTTOM = `calc(env(safe-area-inset-bottom) + ${BAR_OFFSET + BAR_H - TRIGGER_SIZE / 2}px)`

type TentacleConfig = {
  id: 'left-outer' | 'left-inner' | 'right-inner' | 'right-outer' | 'left-deco' | 'right-deco'
  /** Los brazos decorativos (inferiores) no llevan botón. */
  decorative?: boolean
  href: string
  label: string
  icon: typeof Zap
  /** Alto del recuadro local del brazo (define su largo real). */
  h: number
  /** Forma cerrada y rellena, afinada de la base a la punta — el punto
   * final de esta curva, tras rotar `rotate` grados sobre el pivote
   * (base, centro-abajo), cae exactamente en (tx, ty). */
  d: string
  /** Anillos de las ventosas (cara interior, decrecientes hacia la punta),
   * como path de elipses con fill-rule evenodd. */
  suckers: string
  rotate: number
  tx: number
  ty: number
}

// Geometría resuelta para que cada brazo term ine exactamente en el
// centro de su botón (ver nota técnica arriba). Los 4 botones forman un
// arco superior (los internos más altos que los externos), no una fila
// horizontal — como los tentáculos abiertos de un pulpo real.
const TENTACLES: TentacleConfig[] = [
  {
    id: 'left-outer',
    href: '/dashboard/clients',
    label: 'Clientes',
    icon: Users,
    h: 184,
    d: 'M42.59,189.13 L44.00,186.18 L45.43,183.12 L46.84,180.01 L48.21,176.83 L49.51,173.59 L50.73,170.29 L51.85,166.93 L52.85,163.51 L53.71,160.05 L54.41,156.55 L54.94,153.01 L55.28,149.46 L55.44,145.90 L55.40,142.35 L55.16,138.83 L54.74,135.35 L54.14,131.92 L53.37,128.55 L52.45,125.26 L51.40,122.03 L50.23,118.88 L48.96,115.80 L47.61,112.78 L46.19,109.83 L44.73,106.94 L43.22,104.11 L41.70,101.33 L40.18,98.59 L38.66,95.90 L37.17,93.25 L35.71,90.64 L34.30,88.07 L32.95,85.52 L31.66,83.01 L30.45,80.53 L29.32,78.07 L28.29,75.63 L27.34,73.21 L26.50,70.80 L25.75,68.40 L25.11,65.99 L24.57,63.59 L24.14,61.17 L23.82,58.73 L23.60,56.27 L23.49,53.78 L23.49,51.25 L23.59,48.69 L23.79,46.10 L24.09,43.46 L24.48,40.79 L24.96,38.09 L25.51,35.35 L26.13,32.59 L26.80,29.79 L27.51,26.97 L28.25,24.13 L29.01,21.26 L29.76,18.38 L30.46,15.48 L24.45,13.28 L23.11,15.94 L21.81,18.61 L20.53,21.31 L19.26,24.03 L18.02,26.77 L16.81,29.53 L15.66,32.33 L14.56,35.15 L13.54,38.00 L12.59,40.89 L11.74,43.82 L10.99,46.78 L10.36,49.78 L9.84,52.81 L9.45,55.87 L9.20,58.96 L9.09,62.08 L9.12,65.21 L9.29,68.36 L9.60,71.51 L10.05,74.65 L10.61,77.79 L11.30,80.92 L12.09,84.03 L12.97,87.12 L13.94,90.18 L14.97,93.22 L16.04,96.22 L17.15,99.19 L18.28,102.13 L19.41,105.02 L20.53,107.88 L21.61,110.69 L22.65,113.45 L23.63,116.16 L24.54,118.82 L25.35,121.42 L26.07,123.95 L26.69,126.42 L27.19,128.81 L27.57,131.14 L27.84,133.39 L27.99,135.57 L28.02,137.70 L27.94,139.77 L27.75,141.80 L27.44,143.81 L27.03,145.81 L26.51,147.81 L25.87,149.83 L25.12,151.89 L24.26,153.99 L23.27,156.13 L22.17,158.33 L20.96,160.60 L19.64,162.92 L18.21,165.30 L16.70,167.75 L15.10,170.26 L13.41,172.87 Z',
    suckers: 'M30.67,150.96 A6.49,4.13 13.2 1 0 43.30,153.93 A6.49,4.13 13.2 1 0 30.67,150.96 Z M33.83,151.70 A3.24,2.06 13.2 1 0 40.14,153.19 A3.24,2.06 13.2 1 0 33.83,151.70 Z M32.62,137.29 A5.86,3.73 -5.0 1 0 44.30,136.27 A5.86,3.73 -5.0 1 0 32.62,137.29 Z M35.54,137.04 A2.93,1.87 -5.0 1 0 41.38,136.52 A2.93,1.87 -5.0 1 0 35.54,137.04 Z M29.16,119.94 A5.23,3.33 -21.2 1 0 38.92,116.15 A5.23,3.33 -21.2 1 0 29.16,119.94 Z M31.60,118.99 A2.62,1.67 -21.2 1 0 36.48,117.10 A2.62,1.67 -21.2 1 0 31.60,118.99 Z M21.49,100.62 A4.59,2.92 -25.2 1 0 29.80,96.71 A4.59,2.92 -25.2 1 0 21.49,100.62 Z M23.57,99.64 A2.30,1.46 -25.2 1 0 27.73,97.69 A2.30,1.46 -25.2 1 0 23.57,99.64 Z M14.16,80.03 A3.93,2.50 -17.3 1 0 21.67,77.69 A3.93,2.50 -17.3 1 0 14.16,80.03 Z M16.04,79.45 A1.97,1.25 -17.3 1 0 19.79,78.28 A1.97,1.25 -17.3 1 0 16.04,79.45 Z M11.63,58.92 A3.26,2.07 -0.9 1 0 18.14,58.82 A3.26,2.07 -0.9 1 0 11.63,58.92 Z M13.26,58.90 A1.63,1.04 -0.9 1 0 16.51,58.85 A1.63,1.04 -0.9 1 0 13.26,58.90 Z M14.61,41.34 A2.55,1.62 12.6 1 0 19.59,42.46 A2.55,1.62 12.6 1 0 14.61,41.34 Z M15.86,41.62 A1.27,0.81 12.6 1 0 18.34,42.18 A1.27,0.81 12.6 1 0 15.86,41.62 Z',
    rotate: -52,
    tx: -134,
    ty: -104,
  },
  {
    id: 'left-inner',
    href: '/dashboard?openCalendar=1',
    label: 'Agenda',
    icon: CalendarDays,
    h: 176,
    d: 'M43.22,179.87 L44.26,177.08 L45.31,174.19 L46.35,171.24 L47.35,168.24 L48.30,165.19 L49.18,162.09 L49.99,158.94 L50.70,155.76 L51.30,152.53 L51.78,149.28 L52.13,146.01 L52.34,142.73 L52.41,139.45 L52.34,136.18 L52.12,132.93 L51.76,129.72 L51.27,126.54 L50.65,123.41 L49.92,120.33 L49.08,117.31 L48.16,114.34 L47.15,111.42 L46.08,108.56 L44.96,105.76 L43.80,103.00 L42.61,100.30 L41.40,97.63 L40.19,95.01 L38.98,92.43 L37.79,89.89 L36.63,87.38 L35.50,84.90 L34.41,82.44 L33.37,80.02 L32.39,77.62 L31.47,75.23 L30.62,72.87 L29.85,70.51 L29.14,68.16 L28.52,65.82 L27.97,63.48 L27.51,61.13 L27.13,58.76 L26.83,56.39 L26.62,53.99 L26.49,51.57 L26.44,49.13 L26.48,46.66 L26.59,44.16 L26.77,41.63 L27.02,39.07 L27.34,36.49 L27.71,33.88 L28.14,31.24 L28.60,28.58 L29.09,25.90 L29.60,23.20 L30.12,20.48 L30.64,17.75 L31.10,15.00 L24.97,13.17 L23.86,15.72 L22.78,18.28 L21.72,20.86 L20.68,23.46 L19.66,26.08 L18.67,28.71 L17.72,31.38 L16.81,34.06 L15.96,36.77 L15.18,39.51 L14.47,42.28 L13.83,45.08 L13.28,47.90 L12.83,50.75 L12.47,53.63 L12.22,56.53 L12.07,59.46 L12.03,62.39 L12.09,65.34 L12.26,68.29 L12.53,71.25 L12.90,74.20 L13.35,77.14 L13.89,80.07 L14.50,82.98 L15.17,85.88 L15.89,88.75 L16.65,91.60 L17.44,94.41 L18.25,97.20 L19.05,99.95 L19.85,102.67 L20.62,105.35 L21.36,107.98 L22.06,110.57 L22.69,113.11 L23.27,115.61 L23.77,118.04 L24.20,120.43 L24.54,122.76 L24.79,125.03 L24.95,127.25 L25.02,129.41 L25.00,131.53 L24.89,133.61 L24.69,135.66 L24.39,137.69 L24.02,139.71 L23.55,141.72 L22.99,143.75 L22.34,145.80 L21.61,147.87 L20.78,149.98 L19.87,152.13 L18.87,154.33 L17.79,156.57 L16.64,158.87 L15.42,161.22 L14.13,163.63 L12.78,166.13 Z',
    suckers: 'M27.83,144.68 A6.49,4.13 10.9 1 0 40.57,147.13 A6.49,4.13 10.9 1 0 27.83,144.68 Z M31.02,145.29 A3.24,2.06 10.9 1 0 37.38,146.52 A3.24,2.06 10.9 1 0 31.02,145.29 Z M29.60,131.22 A5.86,3.73 -3.9 1 0 41.30,130.43 A5.86,3.73 -3.9 1 0 29.60,131.22 Z M32.53,131.02 A2.93,1.87 -3.9 1 0 38.38,130.63 A2.93,1.87 -3.9 1 0 32.53,131.02 Z M27.17,114.40 A5.23,3.33 -17.2 1 0 37.18,111.31 A5.23,3.33 -17.2 1 0 27.17,114.40 Z M29.68,113.63 A2.62,1.67 -17.2 1 0 34.68,112.08 A2.62,1.67 -17.2 1 0 29.68,113.63 Z M21.57,95.96 A4.59,2.92 -20.5 1 0 30.17,92.74 A4.59,2.92 -20.5 1 0 21.57,95.96 Z M23.72,95.15 A2.30,1.46 -20.5 1 0 28.02,93.54 A2.30,1.46 -20.5 1 0 23.72,95.15 Z M16.26,76.42 A3.93,2.50 -13.9 1 0 23.90,74.53 A3.93,2.50 -13.9 1 0 16.26,76.42 Z M18.17,75.95 A1.97,1.25 -13.9 1 0 21.99,75.00 A1.97,1.25 -13.9 1 0 18.17,75.95 Z M14.64,56.51 A3.26,2.07 -0.6 1 0 21.15,56.45 A3.26,2.07 -0.6 1 0 14.64,56.51 Z M16.27,56.49 A1.63,1.04 -0.6 1 0 19.52,56.46 A1.63,1.04 -0.6 1 0 16.27,56.49 Z M17.21,39.88 A2.55,1.62 10.4 1 0 22.23,40.80 A2.55,1.62 10.4 1 0 17.21,39.88 Z M18.47,40.11 A1.27,0.81 10.4 1 0 20.98,40.57 A1.27,0.81 10.4 1 0 18.47,40.11 Z',
    rotate: -18,
    tx: -50,
    ty: -154,
  },
  {
    id: 'right-inner',
    href: '/dashboard/quotes/quick',
    label: 'Rápida',
    icon: Zap,
    h: 178,
    d: 'M43.22,168.14 L41.86,165.61 L40.57,163.17 L39.33,160.79 L38.17,158.46 L37.08,156.19 L36.07,153.96 L35.14,151.78 L34.31,149.64 L33.56,147.53 L32.90,145.45 L32.33,143.38 L31.86,141.33 L31.47,139.28 L31.17,137.21 L30.96,135.12 L30.84,133.00 L30.81,130.85 L30.88,128.64 L31.03,126.39 L31.28,124.08 L31.61,121.71 L32.02,119.29 L32.52,116.82 L33.08,114.29 L33.72,111.72 L34.40,109.09 L35.13,106.42 L35.89,103.71 L36.68,100.96 L37.47,98.17 L38.27,95.35 L39.04,92.50 L39.79,89.62 L40.50,86.72 L41.16,83.79 L41.76,80.85 L42.28,77.89 L42.72,74.91 L43.08,71.93 L43.34,68.95 L43.49,65.97 L43.55,62.99 L43.49,60.03 L43.33,57.08 L43.06,54.15 L42.70,51.24 L42.23,48.36 L41.67,45.51 L41.03,42.68 L40.30,39.89 L39.51,37.12 L38.65,34.38 L37.74,31.67 L36.77,28.98 L35.78,26.32 L34.75,23.67 L33.69,21.05 L32.62,18.44 L31.54,15.85 L30.41,13.27 L24.28,15.10 L24.76,17.88 L25.28,20.64 L25.81,23.39 L26.33,26.11 L26.84,28.82 L27.31,31.51 L27.74,34.18 L28.12,36.82 L28.45,39.44 L28.72,42.03 L28.91,44.59 L29.03,47.12 L29.07,49.63 L29.04,52.11 L28.92,54.56 L28.71,56.99 L28.43,59.40 L28.05,61.80 L27.60,64.19 L27.06,66.57 L26.45,68.95 L25.75,71.33 L24.98,73.73 L24.14,76.13 L23.23,78.55 L22.26,80.99 L21.23,83.46 L20.15,85.95 L19.03,88.46 L17.87,91.01 L16.69,93.59 L15.49,96.21 L14.29,98.87 L13.10,101.57 L11.92,104.31 L10.77,107.10 L9.66,109.94 L8.60,112.84 L7.61,115.78 L6.69,118.78 L5.87,121.84 L5.15,124.95 L4.55,128.11 L4.07,131.31 L3.73,134.56 L3.52,137.83 L3.46,141.12 L3.54,144.43 L3.76,147.73 L4.12,151.02 L4.61,154.30 L5.23,157.55 L5.94,160.76 L6.76,163.93 L7.65,167.05 L8.61,170.13 L9.62,173.16 L10.66,176.13 L11.73,179.04 L12.78,181.86 Z',
    suckers: 'M15.33,148.85 A6.49,4.13 -11.0 1 0 28.06,146.38 A6.49,4.13 -11.0 1 0 15.33,148.85 Z M18.51,148.24 A3.24,2.06 -11.0 1 0 24.88,147.00 A3.24,2.06 -11.0 1 0 18.51,148.24 Z M14.53,131.97 A5.86,3.73 3.6 1 0 26.24,132.71 A5.86,3.73 3.6 1 0 14.53,131.97 Z M17.46,132.16 A2.93,1.87 3.6 1 0 23.31,132.53 A2.93,1.87 3.6 1 0 17.46,132.16 Z M18.58,112.63 A5.23,3.33 16.7 1 0 28.60,115.64 A5.23,3.33 16.7 1 0 18.58,112.63 Z M21.09,113.38 A2.62,1.67 16.7 1 0 26.10,114.89 A2.62,1.67 16.7 1 0 21.09,113.38 Z M25.52,93.80 A4.59,2.92 20.1 1 0 34.14,96.96 A4.59,2.92 20.1 1 0 25.52,93.80 Z M27.67,94.59 A2.30,1.46 20.1 1 0 31.99,96.17 A2.30,1.46 20.1 1 0 27.67,94.59 Z M31.72,75.35 A3.93,2.50 13.5 1 0 39.37,77.19 A3.93,2.50 13.5 1 0 31.72,75.35 Z M33.63,75.81 A1.97,1.25 13.5 1 0 37.46,76.73 A1.97,1.25 13.5 1 0 33.63,75.81 Z M34.39,57.02 A3.26,2.07 0.3 1 0 40.91,57.06 A3.26,2.07 0.3 1 0 34.39,57.02 Z M36.02,57.03 A1.63,1.04 0.3 1 0 39.28,57.05 A1.63,1.04 0.3 1 0 36.02,57.03 Z M33.26,41.19 A2.55,1.62 -10.5 1 0 38.27,40.26 A2.55,1.62 -10.5 1 0 33.26,41.19 Z M34.51,40.96 A1.27,0.81 -10.5 1 0 37.02,40.50 A1.27,0.81 -10.5 1 0 34.51,40.96 Z',
    rotate: 18,
    tx: 50,
    ty: -156,
  },
  {
    id: 'right-outer',
    href: '/dashboard/quotes/new',
    label: 'Formal',
    icon: FileText,
    h: 184,
    d: 'M42.59,172.87 L40.90,170.26 L39.30,167.75 L37.79,165.30 L36.36,162.92 L35.04,160.60 L33.83,158.33 L32.73,156.13 L31.74,153.99 L30.88,151.89 L30.13,149.83 L29.49,147.81 L28.97,145.81 L28.56,143.81 L28.25,141.80 L28.06,139.77 L27.98,137.70 L28.01,135.57 L28.16,133.39 L28.43,131.14 L28.81,128.81 L29.31,126.42 L29.93,123.95 L30.65,121.42 L31.46,118.82 L32.37,116.16 L33.35,113.45 L34.39,110.69 L35.47,107.88 L36.59,105.02 L37.72,102.13 L38.85,99.19 L39.96,96.22 L41.03,93.22 L42.06,90.18 L43.03,87.12 L43.91,84.03 L44.70,80.92 L45.39,77.79 L45.95,74.65 L46.40,71.51 L46.71,68.36 L46.88,65.21 L46.91,62.08 L46.80,58.96 L46.55,55.87 L46.16,52.81 L45.64,49.78 L45.01,46.78 L44.26,43.82 L43.41,40.89 L42.46,38.00 L41.44,35.15 L40.34,32.33 L39.19,29.53 L37.98,26.77 L36.74,24.03 L35.47,21.31 L34.19,18.61 L32.89,15.94 L31.55,13.28 L25.54,15.48 L26.24,18.38 L26.99,21.26 L27.75,24.13 L28.49,26.97 L29.20,29.79 L29.87,32.59 L30.49,35.35 L31.04,38.09 L31.52,40.79 L31.91,43.46 L32.21,46.10 L32.41,48.69 L32.51,51.25 L32.51,53.78 L32.40,56.27 L32.18,58.73 L31.86,61.17 L31.43,63.59 L30.89,65.99 L30.25,68.40 L29.50,70.80 L28.66,73.21 L27.71,75.63 L26.68,78.07 L25.55,80.53 L24.34,83.01 L23.05,85.52 L21.70,88.07 L20.29,90.64 L18.83,93.25 L17.34,95.90 L15.82,98.59 L14.30,101.33 L12.78,104.11 L11.27,106.94 L9.81,109.83 L8.39,112.78 L7.04,115.80 L5.77,118.88 L4.60,122.03 L3.55,125.26 L2.63,128.55 L1.86,131.92 L1.26,135.35 L0.84,138.83 L0.60,142.35 L0.56,145.90 L0.72,149.46 L1.06,153.01 L1.59,156.55 L2.29,160.05 L3.15,163.51 L4.15,166.93 L5.27,170.29 L6.49,173.59 L7.79,176.83 L9.16,180.01 L10.57,183.12 L12.00,186.18 L13.41,189.13 Z',
    suckers: 'M12.70,153.93 A6.49,4.13 -13.2 1 0 25.33,150.96 A6.49,4.13 -13.2 1 0 12.70,153.93 Z M15.86,153.19 A3.24,2.06 -13.2 1 0 22.17,151.70 A3.24,2.06 -13.2 1 0 15.86,153.19 Z M11.70,136.27 A5.86,3.73 5.0 1 0 23.38,137.29 A5.86,3.73 5.0 1 0 11.70,136.27 Z M14.62,136.52 A2.93,1.87 5.0 1 0 20.46,137.04 A2.93,1.87 5.0 1 0 14.62,136.52 Z M17.08,116.15 A5.23,3.33 21.2 1 0 26.84,119.94 A5.23,3.33 21.2 1 0 17.08,116.15 Z M19.52,117.10 A2.62,1.67 21.2 1 0 24.40,118.99 A2.62,1.67 21.2 1 0 19.52,117.10 Z M26.20,96.71 A4.59,2.92 25.2 1 0 34.51,100.62 A4.59,2.92 25.2 1 0 26.20,96.71 Z M28.27,97.69 A2.30,1.46 25.2 1 0 32.43,99.64 A2.30,1.46 25.2 1 0 28.27,97.69 Z M34.33,77.69 A3.93,2.50 17.3 1 0 41.84,80.03 A3.93,2.50 17.3 1 0 34.33,77.69 Z M36.21,78.28 A1.97,1.25 17.3 1 0 39.96,79.45 A1.97,1.25 17.3 1 0 36.21,78.28 Z M37.86,58.82 A3.26,2.07 0.9 1 0 44.37,58.92 A3.26,2.07 0.9 1 0 37.86,58.82 Z M39.49,58.85 A1.63,1.04 0.9 1 0 42.74,58.90 A1.63,1.04 0.9 1 0 39.49,58.85 Z M36.41,42.46 A2.55,1.62 -12.6 1 0 41.39,41.34 A2.55,1.62 -12.6 1 0 36.41,42.46 Z M37.66,42.18 A1.27,0.81 -12.6 1 0 40.14,41.62 A1.27,0.81 -12.6 1 0 37.66,42.18 Z',
    rotate: 52,
    tx: 134,
    ty: -104,
  },
  {
    id: 'left-deco',
    decorative: true,
    href: '#',
    label: '',
    icon: Zap,
    h: 124,
    d: 'M24.50,105.48 L23.17,105.92 L21.57,106.50 L19.95,107.13 L18.29,107.80 L16.55,108.49 L14.74,109.21 L12.87,109.92 L10.95,110.62 L8.99,111.28 L7.03,111.89 L5.07,112.43 L3.15,112.89 L1.29,113.26 L-0.60,113.52 L-2.72,113.72 L-5.10,113.88 L-7.61,114.00 L-10.22,114.06 L-12.93,114.08 L-15.69,114.05 L-18.51,113.97 L-21.35,113.84 L-24.19,113.66 L-27.01,113.42 L-29.80,113.13 L-32.53,112.80 L-35.19,112.41 L-37.75,111.96 L-40.29,111.46 L-42.87,110.88 L-45.47,110.23 L-48.07,109.53 L-50.68,108.76 L-53.27,107.94 L-55.84,107.07 L-58.37,106.16 L-60.86,105.20 L-63.30,104.21 L-65.67,103.19 L-67.96,102.13 L-70.17,101.06 L-72.23,100.00 L-74.18,98.90 L-76.15,97.65 L-78.15,96.26 L-80.16,94.75 L-82.16,93.15 L-84.12,91.51 L-86.03,89.85 L-87.86,88.21 L-89.60,86.62 L-91.24,85.10 L-92.76,83.68 L-94.15,82.39 L-95.42,81.25 L-97.07,79.85 L-99.76,78.45 L-102.53,77.55 L-105.33,77.11 L-108.08,77.12 L-110.73,77.57 L-113.20,78.41 L-115.43,79.60 L-117.39,81.09 L-119.03,82.83 L-120.32,84.75 L-121.26,86.79 L-121.83,88.89 L-122.04,90.98 L-121.91,93.01 L-121.46,94.92 L-120.73,96.67 L-119.75,98.21 L-118.57,99.51 L-117.24,100.56 L-115.81,101.34 L-114.33,101.83 L-112.85,102.06 L-111.42,102.02 L-110.07,101.74 L-108.86,101.25 L-107.80,100.57 L-106.94,99.75 L-106.40,98.96 L-109.48,96.41 L-109.90,96.76 L-110.25,96.94 L-110.67,97.07 L-111.15,97.14 L-111.67,97.13 L-112.22,97.02 L-112.79,96.81 L-113.35,96.49 L-113.87,96.05 L-114.35,95.50 L-114.75,94.85 L-115.05,94.10 L-115.24,93.28 L-115.29,92.39 L-115.19,91.48 L-114.93,90.55 L-114.52,89.65 L-113.94,88.79 L-113.20,88.01 L-112.33,87.33 L-111.32,86.79 L-110.20,86.40 L-109.00,86.19 L-107.75,86.17 L-106.48,86.36 L-105.22,86.76 L-104.01,87.37 L-102.93,88.15 L-102.69,88.57 L-101.72,89.71 L-100.56,91.09 L-99.24,92.68 L-97.78,94.43 L-96.19,96.30 L-94.47,98.27 L-92.65,100.30 L-90.72,102.36 L-88.70,104.42 L-86.59,106.44 L-84.39,108.41 L-82.10,110.28 L-79.77,112.00 L-77.45,113.56 L-75.08,115.08 L-72.64,116.57 L-70.12,118.02 L-67.52,119.45 L-64.87,120.83 L-62.16,122.18 L-59.41,123.48 L-56.61,124.72 L-53.78,125.91 L-50.92,127.05 L-48.05,128.11 L-45.16,129.11 L-42.25,130.04 L-39.29,130.90 L-36.25,131.69 L-33.15,132.43 L-30.01,133.11 L-26.85,133.72 L-23.67,134.28 L-20.49,134.78 L-17.33,135.21 L-14.20,135.58 L-11.12,135.89 L-8.09,136.14 L-5.14,136.32 L-2.27,136.44 L0.60,136.48 L3.58,136.38 L6.60,136.14 L9.52,135.77 L12.35,135.30 L15.07,134.77 L17.67,134.19 L20.13,133.58 L22.44,132.97 L24.57,132.37 L26.49,131.82 L28.18,131.34 L29.58,130.96 L30.61,130.70 L31.50,130.52 Z',
    suckers: 'M16.53,130.18 A5.39,3.43 254.1 1 0 13.57,119.81 A5.39,3.43 254.1 1 0 16.53,130.18 Z M15.79,127.59 A2.70,1.72 254.1 1 0 14.31,122.40 A2.70,1.72 254.1 1 0 15.79,127.59 Z M-2.35,132.57 A5.00,3.18 268.9 1 0 -2.55,122.58 A5.00,3.18 268.9 1 0 -2.35,132.57 Z M-2.40,130.08 A2.50,1.59 268.9 1 0 -2.50,125.08 A2.50,1.59 268.9 1 0 -2.40,130.08 Z M-26.40,130.31 A4.45,2.83 -82.5 1 0 -25.22,121.48 A4.45,2.83 -82.5 1 0 -26.40,130.31 Z M-26.10,128.11 A2.23,1.42 -82.5 1 0 -25.52,123.69 A2.23,1.42 -82.5 1 0 -26.10,128.11 Z M-50.00,124.19 A3.89,2.47 -72.0 1 0 -47.59,116.79 A3.89,2.47 -72.0 1 0 -50.00,124.19 Z M-49.40,122.34 A1.94,1.24 -72.0 1 0 -48.20,118.64 A1.94,1.24 -72.0 1 0 -49.40,122.34 Z M-71.45,114.29 A3.32,2.11 -62.5 1 0 -68.38,108.40 A3.32,2.11 -62.5 1 0 -71.45,114.29 Z M-70.69,112.82 A1.66,1.06 -62.5 1 0 -69.15,109.88 A1.66,1.06 -62.5 1 0 -70.69,112.82 Z M-89.27,100.80 A2.77,1.76 -47.1 1 0 -85.50,96.74 A2.77,1.76 -47.1 1 0 -89.27,100.80 Z M-88.32,99.78 A1.38,0.88 -47.1 1 0 -86.44,97.76 A1.38,0.88 -47.1 1 0 -88.32,99.78 Z',
    rotate: 0,
    tx: 0,
    ty: 0,
  },
  {
    id: 'right-deco',
    decorative: true,
    href: '#',
    label: '',
    icon: Zap,
    h: 124,
    d: 'M31.50,105.48 L32.83,105.92 L34.43,106.50 L36.05,107.13 L37.71,107.80 L39.45,108.49 L41.26,109.21 L43.13,109.92 L45.05,110.62 L47.01,111.28 L48.97,111.89 L50.93,112.43 L52.85,112.89 L54.71,113.26 L56.60,113.52 L58.72,113.72 L61.10,113.88 L63.61,114.00 L66.22,114.06 L68.93,114.08 L71.69,114.05 L74.51,113.97 L77.35,113.84 L80.19,113.66 L83.01,113.42 L85.80,113.13 L88.53,112.80 L91.19,112.41 L93.75,111.96 L96.29,111.46 L98.87,110.88 L101.47,110.23 L104.07,109.53 L106.68,108.76 L109.27,107.94 L111.84,107.07 L114.37,106.16 L116.86,105.20 L119.30,104.21 L121.67,103.19 L123.96,102.13 L126.17,101.06 L128.23,100.00 L130.18,98.90 L132.15,97.65 L134.15,96.26 L136.16,94.75 L138.16,93.15 L140.12,91.51 L142.03,89.85 L143.86,88.21 L145.60,86.62 L147.24,85.10 L148.76,83.68 L150.15,82.39 L151.42,81.25 L153.07,79.85 L155.76,78.45 L158.53,77.55 L161.33,77.11 L164.08,77.12 L166.73,77.57 L169.20,78.41 L171.43,79.60 L173.39,81.09 L175.03,82.83 L176.32,84.75 L177.26,86.79 L177.83,88.89 L178.04,90.98 L177.91,93.01 L177.46,94.92 L176.73,96.67 L175.75,98.21 L174.57,99.51 L173.24,100.56 L171.81,101.34 L170.33,101.83 L168.85,102.06 L167.42,102.02 L166.07,101.74 L164.86,101.25 L163.80,100.57 L162.94,99.75 L162.40,98.96 L165.48,96.41 L165.90,96.76 L166.25,96.94 L166.67,97.07 L167.15,97.14 L167.67,97.13 L168.22,97.02 L168.79,96.81 L169.35,96.49 L169.87,96.05 L170.35,95.50 L170.75,94.85 L171.05,94.10 L171.24,93.28 L171.29,92.39 L171.19,91.48 L170.93,90.55 L170.52,89.65 L169.94,88.79 L169.20,88.01 L168.33,87.33 L167.32,86.79 L166.20,86.40 L165.00,86.19 L163.75,86.17 L162.48,86.36 L161.22,86.76 L160.01,87.37 L158.93,88.15 L158.69,88.57 L157.72,89.71 L156.56,91.09 L155.24,92.68 L153.78,94.43 L152.19,96.30 L150.47,98.27 L148.65,100.30 L146.72,102.36 L144.70,104.42 L142.59,106.44 L140.39,108.41 L138.10,110.28 L135.77,112.00 L133.45,113.56 L131.08,115.08 L128.64,116.57 L126.12,118.02 L123.52,119.45 L120.87,120.83 L118.16,122.18 L115.41,123.48 L112.61,124.72 L109.78,125.91 L106.92,127.05 L104.05,128.11 L101.16,129.11 L98.25,130.04 L95.29,130.90 L92.25,131.69 L89.15,132.43 L86.01,133.11 L82.85,133.72 L79.67,134.28 L76.49,134.78 L73.33,135.21 L70.20,135.58 L67.12,135.89 L64.09,136.14 L61.14,136.32 L58.27,136.44 L55.40,136.48 L52.42,136.38 L49.40,136.14 L46.48,135.77 L43.65,135.30 L40.93,134.77 L38.33,134.19 L35.87,133.58 L33.56,132.97 L31.43,132.37 L29.51,131.82 L27.82,131.34 L26.42,130.96 L25.39,130.70 L24.50,130.52 Z',
    suckers: 'M39.47,130.18 A5.39,3.43 -74.1 1 0 42.43,119.81 A5.39,3.43 -74.1 1 0 39.47,130.18 Z M40.21,127.59 A2.70,1.72 -74.1 1 0 41.69,122.40 A2.70,1.72 -74.1 1 0 40.21,127.59 Z M58.35,132.57 A5.00,3.18 -88.9 1 0 58.55,122.58 A5.00,3.18 -88.9 1 0 58.35,132.57 Z M58.40,130.08 A2.50,1.59 -88.9 1 0 58.50,125.08 A2.50,1.59 -88.9 1 0 58.40,130.08 Z M82.40,130.31 A4.45,2.83 262.5 1 0 81.22,121.48 A4.45,2.83 262.5 1 0 82.40,130.31 Z M82.10,128.11 A2.23,1.42 262.5 1 0 81.52,123.69 A2.23,1.42 262.5 1 0 82.10,128.11 Z M106.00,124.19 A3.89,2.47 252.0 1 0 103.59,116.79 A3.89,2.47 252.0 1 0 106.00,124.19 Z M105.40,122.34 A1.94,1.24 252.0 1 0 104.20,118.64 A1.94,1.24 252.0 1 0 105.40,122.34 Z M127.45,114.29 A3.32,2.11 242.5 1 0 124.38,108.40 A3.32,2.11 242.5 1 0 127.45,114.29 Z M126.69,112.82 A1.66,1.06 242.5 1 0 125.15,109.88 A1.66,1.06 242.5 1 0 126.69,112.82 Z M145.27,100.80 A2.77,1.76 227.1 1 0 141.50,96.74 A2.77,1.76 227.1 1 0 145.27,100.80 Z M144.32,99.78 A1.38,0.88 227.1 1 0 142.44,97.76 A1.38,0.88 227.1 1 0 144.32,99.78 Z',
    rotate: 0,
    tx: 0,
    ty: 0,
  },
]

const TENTACLE_VIEWBOX_W = 56
const BTN_SIZE = 76

const ARM_SPRING = { type: 'spring', stiffness: 210, damping: 22 } as const
const BUTTON_SPRING = { type: 'spring', stiffness: 300, damping: 24 } as const

/** Resplandor azul muy difuso detrás de todo — la única puesta en
 * escena permitida, aparte del volumen sutil de cada brazo. */
function Glow({ open }: { open: boolean }) {
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute bottom-0 left-1/2"
      style={{
        marginLeft: -70,
        width: 140,
        height: 100,
        borderRadius: '50%',
        background: 'radial-gradient(closest-side, #1e3a5f, transparent 72%)',
        filter: 'blur(18px)',
      }}
      initial={false}
      animate={{ opacity: open ? 0.4 : 0 }}
      transition={{ duration: 0.4 }}
    />
  )
}

/** Un tentáculo orgánico: curva S asimétrica (distinta por brazo), taper
 * real de la base a la punta, degradado sutil de luminosidad y ventosas
 * (anillos) solo en la cara interior, decrecientes hacia la punta.
 * Mientras el menú está abierto ondula con fase propia. */
function TentacleShape({ t, i, open }: { t: TentacleConfig; i: number; open: boolean }) {
  const openDelay = 0.1 + i * 0.045
  const closeDelay = 0.04
  const gradId = `grad-${t.id}`
  const isDeco = !!t.decorative
  /** Sentido del des-enroscado del brazo decorativo: el izquierdo arranca
   * curvado hacia abajo en sentido horario y se despliega a contrarreloj;
   * el derecho, en espejo. */
  const curlDir = t.id.startsWith('left') ? 1 : -1
  return (
    <motion.div
      className="absolute bottom-0 left-1/2"
      style={{ marginLeft: -TENTACLE_VIEWBOX_W / 2 }}
      animate={open ? { rotate: [-1.4, 1.4, -1.4] } : { rotate: 0 }}
      transition={
        open
          ? {
              duration: 2.6 + i * 0.3,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: openDelay + 0.5 + i * 0.4,
            }
          : { duration: 0.2 }
      }
    >
      <motion.svg
        width={TENTACLE_VIEWBOX_W}
        height={t.h}
        viewBox={`0 0 ${TENTACLE_VIEWBOX_W} ${t.h}`}
        className="pointer-events-none origin-bottom overflow-visible"
        style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.38))' }}
        initial={false}
        animate={
          open
            ? isDeco
              ? // Decorativos: des-enroscado desde el núcleo + fundido.
                {
                  rotate: [curlDir * 26, curlDir * -3, 0],
                  scale: [0.1, 1.06, 1],
                  opacity: [0, 1, 1],
                }
              : // Principales: nacen del CENTRO del núcleo (escala uniforme
                // con origen en el pivote = centro de la cabeza), no se
                // "levantan" desde la barra como hacía el scaleY.
                {
                  rotate: [t.rotate * 1.05, t.rotate],
                  scale: [0.22, 1.04, 1],
                  opacity: [0, 1, 1],
                }
            : isDeco
              ? { rotate: curlDir * 26, scale: 0.1, opacity: 0 }
              : { rotate: 0, scale: 0.22, opacity: 0 }
        }
        transition={
          open
            ? {
                duration: 0.32,
                times: [0, 0.72, 1],
                ease: 'easeOut',
                delay: openDelay,
                opacity: { duration: 0.14, delay: openDelay },
              }
            : { ...ARM_SPRING, delay: closeDelay, opacity: { duration: 0.13, delay: closeDelay } }
        }
      >
        <defs>
          {/* Volumen por luminosidad, tonos azules: base más
              luminosa → punta más profunda (3 paradas). En los brazos
              decorativos el degradado corre HORIZONTAL, siguiendo su
              anatomía (la base pegada al núcleo es el lado interior). */}
          <linearGradient
            id={gradId}
            x1={isDeco ? (curlDir === 1 ? '100%' : '0%') : '0%'}
            y1={isDeco ? '0%' : '100%'}
            x2={isDeco ? (curlDir === 1 ? '0%' : '100%') : '0%'}
            y2="0%"
          >
            <stop offset="0%" stopColor="#5a9fd4" />
            <stop offset="55%" stopColor="#3a7fc4" />
            <stop offset="100%" stopColor="#1e5a9f" />
          </linearGradient>
        </defs>
        {/* Sin borde: el brazo se recorta solo con su relleno + sombra
            suave (el stroke oscuro previo se percibía como un "reborde"). */}
        <path d={t.d} fill={`url(#${gradId})`} />
        {/* Ventosas: cara interior, tamaño decreciente hacia la punta. */}
        <path d={t.suckers} fill="rgba(8,12,0,0.62)" fillRule="evenodd" />
      </motion.svg>
    </motion.div>
  )
}

/** El botón que cada tentáculo sostiene: negro, circular, borde azul
 * fino, ícono azul, texto blanco. El tramo final del brazo queda oculto
 * detrás (el botón se dibuja encima), dando la sensación de que entra al
 * círculo en vez de quedar pegado sobre él. */
function ActionButton({
  t,
  i,
  open,
  action,
}: {
  t: TentacleConfig
  i: number
  open: boolean
  /** La acción configurable que ocupa este brazo (Ajustes → Personalización
   *  → Menú del pulpo). La geometría del brazo es fija; el destino no. */
  action: OctopusAction
}) {
  const Icon = action.icon
  const openDelay = 0.1 + i * 0.06 + 0.24
  return (
    <motion.div
      className="pointer-events-auto absolute bottom-0 left-1/2"
      style={{ marginLeft: -BTN_SIZE / 2 }}
      initial={false}
      animate={{
        x: open ? t.tx : 0,
        y: open ? t.ty : 0,
        scale: open ? 1 : 0,
        opacity: open ? 1 : 0,
      }}
      transition={{ ...BUTTON_SPRING, delay: open ? openDelay : 0 }}
    >
      <Link
        href={action.href}
        aria-label={action.label}
        tabIndex={open ? 0 : -1}
        className="flex flex-col items-center justify-center gap-1.5 rounded-full border-2 bg-[#0d0d0d]"
        style={{
          width: BTN_SIZE,
          height: BTN_SIZE,
          borderColor: '#1e3a5f',
          boxShadow: '0 0 18px rgba(30,58,95,0.28), 0 6px 18px rgba(0,0,0,0.55)',
        }}
      >
        <Icon className="size-6" style={{ color: '#4a90d9' }} strokeWidth={2} />
        <span className="text-[11px] font-medium leading-none text-white">{action.label}</span>
      </Link>
    </motion.div>
  )
}

/** Color azul para el menú de Crisbo Tattoo */
const CRISBO_BLUE = '#1e3a5f'
const CRISBO_BLUE_GLOW = 'rgba(30, 58, 95, 0.35)'

/** El botón disparador ES el centro del menú — no hay una segunda forma
 * compitiendo con él. Siempre el mismo círculo azul; al abrir, su ícono
 * se desvanece y aparece la foto del tatuador en el mismo lugar
 * (crossfade). Los tentáculos nacen de detrás suyo. */
function TriggerButton({
  open,
  onToggle,
  avatarUrl,
}: {
  open: boolean
  onToggle: () => void
  avatarUrl: string | null
}) {
  return (
    <motion.button
      type="button"
      aria-haspopup="true"
      aria-expanded={open}
      aria-label={open ? 'Cerrar accesos rápidos' : 'Accesos rápidos'}
      onClick={onToggle}
      data-tour="octopus-trigger"
      initial={false}
      animate={{ scale: open ? 1.08 : 1 }}
      transition={{ type: 'spring', stiffness: 340, damping: 20 }}
      whileTap={{ scale: 0.94 }}
      className="pointer-events-auto fixed left-1/2 z-40 flex items-center justify-center rounded-full border-[2.5px] bg-[#0a0a0a] lg:hidden"
      style={{
        bottom: TRIGGER_BOTTOM,
        marginLeft: -TRIGGER_SIZE / 2,
        width: TRIGGER_SIZE,
        height: TRIGGER_SIZE,
        borderColor: CRISBO_BLUE,
        boxShadow: `0 0 26px ${CRISBO_BLUE_GLOW}, 0 8px 22px rgba(0,0,0,0.5)`,
      }}
    >
      {/* Segundo aro interior — el "núcleo" de la referencia. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-1 rounded-full"
        style={{ border: `1px solid ${CRISBO_BLUE}55` }}
      />
      <span className="relative flex size-12 items-center justify-center">
        {/* Isotipo de Crisbo Tattoo (CB) sin fondo.
            El crossfade es SECUENCIAL: el isotipo desaparece por completo
            (scale 0) antes de que entre la foto — nunca se ven las dos
            capas superpuestas ("doble"). */}
        <motion.span
          aria-hidden="true"
          className="absolute size-10"
          initial={false}
          animate={{ opacity: open ? 0 : 1, scale: open ? 0.5 : 1 }}
          transition={{ duration: 0.14, delay: open ? 0 : 0.14 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/cb-isotipo.png" alt="" className="size-full object-contain" />
        </motion.span>
        {avatarUrl && (
          <motion.span
            className="absolute flex items-center justify-center overflow-hidden rounded-full border-2"
            style={{ borderColor: `${CRISBO_BLUE}66` }}
            initial={false}
            animate={{
              opacity: open ? 1 : 0,
              scale: open ? 1 : 0.5,
              width: open ? 64 : 44,
              height: open ? 64 : 44,
            }}
            transition={{ duration: 0.18, delay: open ? 0.14 : 0 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarUrl} alt="" className="size-full object-cover" />
          </motion.span>
        )}
      </span>
    </motion.button>
  )
}

export function OctopusMenu({
  avatarUrl = null,
  isStudioOwner,
}: {
  avatarUrl?: string | null
  isStudioOwner?: boolean
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const defaultSlots = isStudioOwner ? DEFAULT_OCTOPUS_SLOTS_ESTUDIO : DEFAULT_OCTOPUS_SLOTS

  // Acciones de los 4 botones (configurables en Ajustes → Personalización).
  // Arranca con el default para que el server render coincida; el efecto lee
  // la preferencia guardada y escucha cambios en vivo (mismo tab u otro).
  const [slots, setSlots] = useState<string[]>(defaultSlots)
  useEffect(() => {
    const sync = () => setSlots(readOctopusSlots(defaultSlots))
    sync()
    window.addEventListener(OCTOPUS_CONFIG_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(OCTOPUS_CONFIG_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStudioOwner])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open])

  // Cerrar al navegar de ruta.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  if (pathname === '/dashboard/quotes/new' || pathname === '/dashboard/quotes/quick') return null

  return (
    <div className="lg:hidden">
      {/* Fondo desenfocado mientras está abierto — sin isotipo arriba
          (retirado a pedido). */}
      <motion.div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        initial={false}
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className={`fixed inset-0 z-10 bg-black/80 ${
          open ? '' : 'pointer-events-none'
        }`}
      />

      {/* Resplandor + tentáculos: por ENCIMA de la barra (z-30) pero por
          DEBAJO del botón disparador (z-40) — así se ven desprenderse del
          propio botón, no asomar desde atrás de la barra. */}
      <div
        aria-hidden={!open}
        className="pointer-events-none fixed inset-x-0 z-[32]"
        style={{ bottom: PIVOT_BOTTOM }}
      >
        <Glow open={open} />
      </div>
      <div
        aria-hidden={!open}
        className="pointer-events-none fixed inset-x-0 z-[35]"
        style={{ bottom: PIVOT_BOTTOM }}
      >
        {TENTACLES.map((t, i) => (
          <TentacleShape key={t.id} t={t} i={i} open={open} />
        ))}
      </div>

      <TriggerButton open={open} onToggle={() => setOpen((v) => !v)} avatarUrl={avatarUrl} />

      {/* Botones: siempre por encima de todo (z-50). */}
      <div
        aria-hidden={!open}
        className="pointer-events-none fixed inset-x-0 z-50"
        style={{ bottom: PIVOT_BOTTOM }}
      >
        {TENTACLES.filter((t) => !t.decorative).map((t, i) => (
          <ActionButton key={t.id} t={t} i={i} open={open} action={actionById(slots[i]!)} />
        ))}
      </div>
    </div>
  )
}
