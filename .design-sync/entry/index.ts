// Punto de entrada del sistema de diseño de Crisbo Tattoo para claude.ai/design.
// Solo reexporta componentes reales de la app que no dependen de datos ni de
// acciones del servidor; nada aquí es una reimplementación.
import './next-shim'
export { CrisboRoot } from './crisbo-root'

// Base (shadcn + base-ui)
export { Badge, badgeVariants } from '../../src/components/ui/badge'
export { Button, buttonVariants } from '../../src/components/ui/button'
export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent } from '../../src/components/ui/card'
export { Checkbox } from '../../src/components/ui/checkbox'
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from '../../src/components/ui/dialog'
export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '../../src/components/ui/dropdown-menu'
export { Input } from '../../src/components/ui/input'
export { Label } from '../../src/components/ui/label'
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '../../src/components/ui/select'
export { Textarea } from '../../src/components/ui/textarea'

// Gráficas y tarjetas de Estadísticas
export { DailyBars, CumulativeChart, Donut, Ring, Columns, DeltaChip, CHART_COLORS } from '../../src/components/stats/charts'
export { StatsKpiGrid } from '../../src/components/stats/stats-kpi-grid'
export { StatsFunnel } from '../../src/components/stats/stats-funnel'
export { StatsHoursCard } from '../../src/components/stats/stats-hours-card'
export { StatsStylesRanking } from '../../src/components/stats/stats-styles-ranking'
export { StatsClientsCard } from '../../src/components/stats/stats-insight-cards'
export { StatsAudienceCard } from '../../src/components/stats/stats-audience-card'
export { StatsRecommendations } from '../../src/components/stats/stats-recommendations'
export { StatsObjectives } from '../../src/components/stats/stats-objectives'
export { StatsOccupancyCalendar } from '../../src/components/stats/stats-occupancy-calendar'
export { StatsZonesMap } from '../../src/components/stats/stats-zones-map'

// Inicio
export { OccupancyRing } from '../../src/components/home/occupancy-ring'
export { ExpenseAlertsCard } from '../../src/components/home/expense-alerts-card'
export { PendingImportantCard } from '../../src/components/home/pending-important-card'

// Compartidos
export { EmptyState } from '../../src/components/shared/empty-state'
export { PageHeader } from '../../src/components/shared/page-header'
export { StatusBadge } from '../../src/components/shared/status-badge'

// Íconos Phosphor que usa la app (navegación, módulos, tarjetas).
export {
  CalendarCheck,
  CalendarDots,
  CaretLeft,
  CaretRight,
  ChartLineUp,
  ChatsCircle,
  ClipboardText,
  Coins,
  GearSix,
  Hourglass,
  House,
  ImagesSquare,
  Lightbulb,
  PenNib,
  Signature,
  SquaresFour,
  Target,
  TrendDown,
  TrendUp,
  UsersThree,
  Wallet,
  Warning,
} from '@phosphor-icons/react'
