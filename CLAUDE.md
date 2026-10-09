<p align="center">
  <img src="cb-logo.png" width="120" alt="Crisbo Tattoo Logo">
</p>

# Proyecto: Crisbo Tattoo (OFINK)

## Contexto General

Sistema de gestión completo para estudio de tatuajes **Crisbo Tattoo**. Incluye agenda, proyectos, sesiones, pagos, inventario, cotizaciones, consentimientos, galería, y gestión de equipo.

## Stack Tecnológico

- **Framework**: Next.js 16 (App Router)
- **Frontend**: React 19, Tailwind CSS 4, Shadcn/UI
- **Backend**: Supabase (Auth, Database, Storage)
- **Forms**: React Hook Form + Zod
- **Animaciones**: Motion (Framer Motion)
- **PDF**: @react-pdf/renderer
- **Notificaciones**: Web Push, Sonner (toasts)

## Repositorio GitHub

- **URL**: https://github.com/cristianbomoreno-source/Crisbo-tattoo-.git
- **Branch principal**: main

## Vercel

- **Project ID**: `prj_vmQxvNKQMFLiLRXJCSfaihiXSwdX`
- **Project Name**: `crisbo-next`

## Estructura del Proyecto

```
Crisbo-tattoo-/
├── src/
│   ├── actions/           # Server Actions (mutations)
│   │   ├── auth.ts        # Autenticación
│   │   ├── clients.ts     # Clientes
│   │   ├── projects.ts    # Proyectos
│   │   ├── sessions.ts    # Sesiones/citas
│   │   ├── payments.ts    # Pagos
│   │   ├── expenses.ts    # Gastos
│   │   ├── quotes.ts      # Cotizaciones
│   │   ├── inventory.ts   # Inventario
│   │   ├── gallery.ts     # Galería
│   │   ├── team.ts        # Equipo
│   │   └── ...
│   ├── queries/           # Queries de Supabase (lectura)
│   │   ├── clients.ts
│   │   ├── projects.ts
│   │   ├── sessions.ts
│   │   ├── expenses.ts
│   │   └── ...
│   ├── app/
│   │   ├── (auth)/        # Páginas de autenticación
│   │   ├── (dashboard)/   # Dashboard principal
│   │   │   └── dashboard/
│   │   │       ├── clients/    # Gestión de clientes
│   │   │       ├── projects/   # Proyectos de tatuaje
│   │   │       ├── quotes/     # Cotizaciones
│   │   │       ├── consents/   # Consentimientos
│   │   │       ├── gallery/    # Galería de trabajos
│   │   │       ├── stats/      # Estadísticas/finanzas
│   │   │       ├── estudio/    # Configuración estudio
│   │   │       └── settings/   # Configuración usuario
│   │   ├── (public)/      # Páginas públicas
│   │   ├── (bot)/         # Bot/asistente
│   │   ├── admin/         # Panel de admin
│   │   └── api/           # API routes
│   ├── components/        # Componentes reutilizables
│   ├── lib/
│   │   ├── supabase/      # Cliente Supabase (client, server, admin)
│   │   ├── types/         # TypeScript types (database.types.ts)
│   │   ├── finance/       # Lógica de finanzas
│   │   ├── calendar/      # Lógica de calendario
│   │   ├── pdf/           # Generación de PDFs
│   │   └── validations/   # Esquemas Zod
│   └── proxy.ts           # Proxy utils
├── public/                # Assets estáticos
├── rls-policies.sql       # Políticas RLS de Supabase
└── design-system.md       # Sistema de diseño
```

## Tablas en Supabase

### Principales
| Tabla | Descripción |
|-------|-------------|
| `artists` | Artistas/tatuadores (FK a auth.users) |
| `artist_permissions` | Permisos granulares por artista |
| `studios` | Estudios de tatuaje |
| `clients` | Clientes del estudio |
| `projects` | Proyectos de tatuaje |
| `sessions` | Sesiones/citas programadas |

### Pagos y Finanzas
| Tabla | Descripción |
|-------|-------------|
| `payments` | Pagos recibidos |
| `expenses` | Gastos del estudio |
| `session_materials` | Materiales usados por sesión |

### Cotizaciones y Consentimientos
| Tabla | Descripción |
|-------|-------------|
| `quotes` | Cotizaciones |
| `quote_links` | Links públicos de cotización |
| `consents` | Consentimientos firmados |
| `consent_templates` | Plantillas de consentimiento |
| `consent_links` | Links para firmar consentimiento |

### Inventario y Galería
| Tabla | Descripción |
|-------|-------------|
| `inventory_categories` | Categorías de inventario |
| `inventory_items` | Items de inventario |
| `gallery` | Galería de trabajos |

### Otros
| Tabla | Descripción |
|-------|-------------|
| `blocked_days` | Días bloqueados en agenda |
| `work_shifts` | Turnos de trabajo |
| `notifications` | Notificaciones |
| `push_subscriptions` | Suscripciones push |
| `studio_invitations` | Invitaciones al estudio |
| `studio_join_requests` | Solicitudes para unirse |
| `studio_links` | Links públicos del estudio |
| `tour_progress` | Progreso del tour/tutorial |
| `feature_feedback` | Feedback de features |
| `platform_admins` | Administradores de plataforma |

## Roles de Usuario

| Rol | Descripción |
|-----|-------------|
| `owner` | Dueño del estudio (todos los permisos) |
| `artist` | Tatuador (permisos configurables) |

## Permisos de Artista

Los permisos se configuran en `artist_permissions`:
- `can_create_appointments` - Crear citas
- `can_move_appointments` - Mover citas
- `can_cancel_sessions` - Cancelar sesiones
- `can_create_clients` - Crear clientes
- `can_edit_clients` - Editar clientes
- `can_create_projects` - Crear proyectos
- `can_edit_projects` - Editar proyectos
- `can_delete_projects` - Eliminar proyectos
- `can_modify_prices` - Modificar precios
- `can_edit_duration` - Editar duración
- `can_block_schedule` - Bloquear agenda
- `can_respond_quotes` - Responder cotizaciones
- `can_use_inventory` - Usar inventario
- `can_edit_inventory` - Editar inventario
- `can_create_inventory_categories` - Crear categorías
- `can_discount_materials` - Descontar materiales

## Comandos Útiles

### Desarrollo
```bash
cd /Users/crisbo/Crisbo/Crisbo-tattoo-
npm run dev       # Iniciar servidor de desarrollo
npm run build     # Build de producción
npm run lint      # Linter
npm run test      # Tests con Vitest
```

### Git
```bash
git status
git add -A && git commit -m "mensaje"
git push origin main
```

### Vercel
```bash
vercel            # Deploy preview
vercel --prod     # Deploy producción
```

## URLs

- **GitHub**: https://github.com/cristianbomoreno-source/Crisbo-tattoo-.git
- **Vercel Dashboard**: https://vercel.com/crisbo/crisbo-next

## Archivos Clave

### Configuración
```
.env.local                 → Variables de entorno (Supabase keys)
next.config.ts             → Configuración de Next.js
rls-policies.sql           → Políticas RLS de Supabase
```

### Estilos
```
src/app/globals.css        → Estilos globales y variables CSS
design-system.md           → Documentación del sistema de diseño
```

### Supabase
```
src/lib/supabase/client.ts → Cliente para componentes client
src/lib/supabase/server.ts → Cliente para Server Components/Actions
src/lib/supabase/admin.ts  → Cliente con service role (admin)
src/lib/types/database.types.ts → Tipos generados de la DB
```

## Notas Importantes

1. **RLS habilitado** - Todas las tablas tienen Row Level Security
2. **Server Actions** - Las mutaciones usan Server Actions en `src/actions/`
3. **Queries separadas** - Las lecturas están en `src/queries/` para reutilizar
4. **Multi-tenant** - Soporta múltiples estudios y artistas
5. **Permisos granulares** - Cada artista tiene permisos configurables

## Commits Recientes

- Filtro de fechas y reporte completo en finanzas
- Alertas de gastos y recomendaciones inteligentes
- Popup de pagos en tarjeta de ingresos confirmados
- Auditoría de seguridad + barrido de bugs
