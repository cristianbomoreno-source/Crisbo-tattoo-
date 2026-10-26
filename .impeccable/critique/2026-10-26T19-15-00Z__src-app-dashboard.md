---
target: todo el diseño de la app
total_score: 22
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:C:\\Users\\crist\\repos\\Crisbo-tattoo-\\src\\app\\(dashboard)"
timestamp: 2026-10-26T19-15-00Z
slug: src-app-dashboard
---
# Critique — Crisbo Tattoo, app autenticada (src/app/(dashboard) + src/components), modo Operate

## Design Health Score: 22/40 (Acceptable)
| # | Heurística | Puntaje | Problema clave |
|---|---|---|---|
| 1 | Estado del sistema | 3 | Toasts en cada acción; la entrada a caja solo se insinúa con una pestañita de 16px |
| 2 | Lenguaje real | 2 | "Iniciar sesión" = empezar jornada (choca con sesión de tatuaje/login); "300 min" |
| 3 | Control y libertad | 2 | Sin deshacer en Marcar pagado/recibido; window.confirm nativo para borrar |
| 4 | Consistencia | 2 | 3 amarillos/dorados + esmeralda fuera del sistema; design-system.md contradice el código; botones h-7/h-8/py-2.5 |
| 5 | Prevención de errores | 2 | Basura de 14px bajo Marcar pagado y Descuento en una columna estrecha |
| 6 | Reconocer vs recordar | 1 | Sin entrada móvil a Galería, Consentimientos, Clientes, Estadísticas, lista de Cotizaciones; crear proyecto oculto en móvil |
| 7 | Flexibilidad | 3 | Atajos de iPhone/SMS; filtros de proyectos pobres |
| 8 | Estético/minimalista | 2 | Inicio móvil apila 7-8 bloques; las citas de hoy salen 3 veces |
| 9 | Recuperación de errores | 3 | Errores claros; estados vacíos sin acción |
| 10 | Ayuda | 2 | Tour con etiquetas de pestañas que ya no existen |

## Veredicto de especificidad
Parcialmente propio: paleta sacada del estudio (luz LED dorada, concreto, maleta roja), fotos reales en hero, tarjetas de proyecto y próxima cita, vocabulario del oficio. Debajo del hero es UI genérica de shadcn (círculo con ícono + número + etiqueta). Las fuentes de títulos (--font-display/--font-title) apuntan a la sans: todo es Inter bold.
Detector: (dashboard) limpio; components 3 hallazgos: side-tab en projects-board.tsx:155 (real), bounce en intake-chat.tsx:252 (falso positivo: puntos de "escribiendo") y section-arrow.tsx:21 (landing pública, sin motion-reduce).

## Problemas prioritarios
- [P0] Navegación móvil dejó huérfanas 5 secciones al quitar el pulpo; CreateProjectDialog es hidden lg:block (projects/page.tsx:30). Fix: Estudio como hub de módulos + botón Nuevo proyecto en móvil. Comando: layout.
- [P1] Áreas táctiles < 44px (button.tsx h-8/h-7/size-8, chips h-7, chevrons 24px, pestaña de caja 16px, acciones de FixedRow). Comando: harden/adapt.
- [P1] Momentos de plata sin tranquilidad ni reversa (sin deshacer, confirm nativo, saldo negativo sin explicar, esmeralda suelto). Comando: clarify + harden.
- [P2] Inicio sobrecargado y repetido. Comando: distill.
- [P2] Deriva de tokens y tipografía (doc viejo, fuentes alias, textos de 8-10px y contraste ~3:1 en tarjetas de proyecto). Comando: typeset + colorize.

## Personas
Casey (una mano): botones de 28-32px, caja escondida tras un gesto, pagar/descuento/borrar apilados. Alex: sin ruta móvil a estadísticas/galería/consentimientos, filtros pobres. Sam: tarjetas div role=button con texto de 8px, significado solo por color.

## Preguntas
1. Entre quitarse los guantes y saludar al siguiente cliente, ¿qué tarjeta de Inicio sobrevive?
2. ¿La caja es un lugar (pestaña) o un gesto?
3. ¿Qué haría que esto sea inconfundiblemente de un estudio de tatuajes: el trabajo (fotos, stencils, sanación) o los números?
