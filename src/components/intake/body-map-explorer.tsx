'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Check, Eye, EyeOff } from 'lucide-react'
import {
  regionImage, type MapGender, type Region, type Vista, type Lado, type LadoPierna, type Profundidad,
  CUELLO_OPTIONS, CARA_OPTIONS, cuelloImage, caraImage,
  brazoLadoImage, brazoProfundidadImage, BRAZO_EXTERNA_OPTIONS, BRAZO_INTERNA_OPTIONS, brazoSubzonaImage,
  TORSO_FRENTE_OPTIONS, TORSO_ESPALDA_OPTIONS, torsoImage,
  piernaLadoImage, piernaProfundidadImage, PIERNA_EXTERNA_OPTIONS, PIERNA_INTERNA_OPTIONS, piernaSubzonaImage,
} from '@/lib/body-map-assets'

type Screen =
  | { level: 'region' }
  | { level: 'cabeza-group' }
  | { level: 'cabeza-item'; group: 'cuello' | 'cara' }
  | { level: 'brazo-lado' }
  | { level: 'brazo-prof'; lado: Lado }
  | { level: 'brazo-item'; lado: Lado; prof: Profundidad }
  | { level: 'torso-vista' }
  | { level: 'torso-item' }
  | { level: 'pierna-lado' }
  | { level: 'pierna-prof'; lado: LadoPierna }
  | { level: 'pierna-item'; lado: LadoPierna; prof: Profundidad }

const REGIONS: Region[] = ['Cabeza', 'Brazos', 'Torso', 'Piernas']

/**
 * Explorador anatómico: Región → (Torso: Vista) → subzona específica, con
 * fotos reales en cada nivel. "Vista" (Frente/Espaldas) ya NO es un paso
 * global — solo aparece dentro de Torso, que es la única región cuyo
 * contenido cambia según se vea de frente o de espaldas.
 *
 * Orden espejado: en cualquier pantalla con opciones "izquierdo/derecho"
 * apareadas, el lado DERECHO se muestra primero (columna izquierda de la
 * grilla) y el IZQUIERDO segundo (columna derecha) — así coincide con cómo
 * se ve una persona de frente (su derecha queda del lado izquierdo del
 * espectador), en vez de como se leería un texto.
 *
 * Al llegar a una hoja arma un string legible ("Brazo — Derecho — Externa —
 * Codo") y lo entrega vía onDone — se guarda igual que cualquier otra
 * respuesta de `zone`, sin cambiar el resto del flujo.
 */
export function BodyMapExplorer({ gender, onDone }: { gender: MapGender; onDone: (label: string) => void }) {
  const [vista, setVista] = useState<Vista | null>(null)
  const [screen, setScreen] = useState<Screen>({ level: 'region' })
  const [crumbs, setCrumbs] = useState<string[]>([])

  function push(next: Screen, crumb: string) {
    setCrumbs(c => [...c, crumb])
    setScreen(next)
  }

  function back() {
    if (crumbs.length === 0) return
    setCrumbs(c => c.slice(0, -1))
    switch (screen.level) {
      case 'cabeza-group': setScreen({ level: 'region' }); return
      case 'cabeza-item': setScreen({ level: 'cabeza-group' }); return
      case 'brazo-lado': setScreen({ level: 'region' }); return
      case 'brazo-prof': setScreen({ level: 'brazo-lado' }); return
      case 'brazo-item': setScreen({ level: 'brazo-prof', lado: screen.lado }); return
      case 'torso-vista': setScreen({ level: 'region' }); return
      case 'torso-item': setScreen({ level: 'torso-vista' }); return
      case 'pierna-lado': setScreen({ level: 'region' }); return
      case 'pierna-prof': setScreen({ level: 'pierna-lado' }); return
      case 'pierna-item': setScreen({ level: 'pierna-prof', lado: screen.lado }); return
      default: return
    }
  }

  function finish(finalCrumbs: string[]) {
    onDone(finalCrumbs.join(' — '))
  }

  return (
    <div className="flex w-full flex-1 min-h-0 flex-col">
      {crumbs.length > 0 && (
        <div className="mb-3 flex shrink-0 items-center gap-1.5 overflow-x-auto">
          <button type="button" onClick={back} className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-full bg-card text-white/70">
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          {crumbs.map((c, i) => (
            <span key={i} className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
              {i > 0 && <ChevronRight className="size-3" aria-hidden />}
              <span className={i === crumbs.length - 1 ? 'font-semibold text-primary' : ''}>{c}</span>
            </span>
          ))}
        </div>
      )}

      <div key={JSON.stringify(screen)} className="flex flex-1 min-h-0 flex-col animate-fade-in">
        {screen.level === 'region' && (
          <RegionScreen
            gender={gender}
            onPick={region => {
              if (region === 'Cabeza') push({ level: 'cabeza-group' }, 'Cabeza')
              else if (region === 'Brazos') push({ level: 'brazo-lado' }, 'Brazo')
              else if (region === 'Torso') push({ level: 'torso-vista' }, 'Torso')
              else push({ level: 'pierna-lado' }, 'Pierna')
            }}
          />
        )}

        {screen.level === 'cabeza-group' && (
          <GroupPicker
            title="¿Cuello o cara?"
            options={[
              { key: 'cuello', label: 'Cuello', image: cuelloImage(gender, 'completo') },
              { key: 'cara', label: 'Cara', image: caraImage(gender, 'frente') },
            ]}
            onPick={key => push({ level: 'cabeza-item', group: key as 'cuello' | 'cara' }, key === 'cuello' ? 'Cuello' : 'Cara')}
          />
        )}

        {screen.level === 'cabeza-item' && (
          <ItemGrid
            options={(screen.group === 'cuello' ? CUELLO_OPTIONS : CARA_OPTIONS).map(o => ({
              key: o.key,
              label: o.label,
              image: screen.group === 'cuello' ? cuelloImage(gender, o.key) : caraImage(gender, o.key),
            }))}
            onPick={(key, label) => finish([...crumbs, label])}
          />
        )}

        {screen.level === 'brazo-lado' && (
          <LadoPicker
            options={[
              { key: 'derecho', label: 'Derecho', image: brazoLadoImage(gender, 'derecho') },
              { key: 'izquierdo', label: 'Izquierdo', image: brazoLadoImage(gender, 'izquierdo') },
            ]}
            onPick={lado => push({ level: 'brazo-prof', lado: lado as Lado }, lado === 'izquierdo' ? 'Izquierdo' : 'Derecho')}
          />
        )}

        {screen.level === 'brazo-prof' && (
          <ProfundidadPicker
            options={[
              { key: 'externa', label: 'Parte externa', image: brazoProfundidadImage(gender, screen.lado, 'externa') },
              { key: 'interna', label: 'Parte interna', image: brazoProfundidadImage(gender, screen.lado, 'interna') },
            ]}
            onPick={prof => push({ level: 'brazo-item', lado: screen.lado, prof: prof as Profundidad }, prof === 'externa' ? 'Externa' : 'Interna')}
          />
        )}

        {screen.level === 'brazo-item' && (
          <ItemGrid
            options={(screen.prof === 'externa' ? BRAZO_EXTERNA_OPTIONS : BRAZO_INTERNA_OPTIONS).map(o => ({
              key: o.key,
              label: o.label,
              image: brazoSubzonaImage(gender, screen.lado, screen.prof, o.key),
            }))}
            onPick={(key, label) => finish([...crumbs, label])}
          />
        )}

        {screen.level === 'torso-vista' && (
          <VistaScreen
            onPick={v => { setVista(v); push({ level: 'torso-item' }, v) }}
          />
        )}

        {screen.level === 'torso-item' && (
          <ItemGrid
            options={mirrorPairs(
              (vista === 'Espaldas' ? TORSO_ESPALDA_OPTIONS : TORSO_FRENTE_OPTIONS).map(o => ({
                key: o.key,
                label: o.label,
                image: torsoImage(gender, o.key),
              }))
            )}
            onPick={(key, label) => finish([...crumbs, label])}
          />
        )}

        {screen.level === 'pierna-lado' && (
          <LadoPicker
            options={[
              { key: 'derecha', label: 'Derecha', image: piernaLadoImage(gender, 'derecha') },
              { key: 'izquierda', label: 'Izquierda', image: piernaLadoImage(gender, 'izquierda') },
            ]}
            onPick={lado => push({ level: 'pierna-prof', lado: lado as LadoPierna }, lado === 'izquierda' ? 'Izquierda' : 'Derecha')}
          />
        )}

        {screen.level === 'pierna-prof' && (
          <ProfundidadPicker
            options={[
              { key: 'externa', label: 'Parte externa', image: piernaProfundidadImage(gender, screen.lado, 'externa') },
              { key: 'interna', label: 'Parte interna', image: piernaProfundidadImage(gender, screen.lado, 'interna') },
            ]}
            onPick={prof => push({ level: 'pierna-item', lado: screen.lado, prof: prof as Profundidad }, prof === 'externa' ? 'Externa' : 'Interna')}
          />
        )}

        {screen.level === 'pierna-item' && (
          <ItemGrid
            options={(screen.prof === 'externa' ? PIERNA_EXTERNA_OPTIONS : PIERNA_INTERNA_OPTIONS).map(o => ({
              key: o.key,
              label: o.label,
              image: piernaSubzonaImage(gender, screen.lado, screen.prof, o.key),
            }))}
            onPick={(key, label) => finish([...crumbs, label])}
          />
        )}
      </div>

      <button
        type="button"
        onClick={() => onDone('No lo sé')}
        className="mt-3 shrink-0 text-center text-xs text-muted-foreground underline-offset-2 hover:underline"
      >
        No estoy seguro todavía
      </button>
    </div>
  )
}

/** Reordena pares "izquierdo/izq" e "derecho/der" consecutivos para que el
 * lado derecho quede siempre primero (columna izquierda de la grilla),
 * reflejando cómo se ve una persona de frente. Los ítems sin par (ej. "Pecho
 * completo") quedan donde están. */
function mirrorPairs(options: Opt[]): Opt[] {
  const result = [...options]
  for (let i = 0; i < result.length - 1; i++) {
    const a = result[i]!.key
    const b = result[i + 1]!.key
    const aIsIzq = a.includes('izq')
    const bIsDer = b.includes('der')
    if (aIsIzq && bIsDer) {
      const tmp = result[i]!
      result[i] = result[i + 1]!
      result[i + 1] = tmp
    }
  }
  return result
}

function VistaScreen({ onPick }: { onPick: (v: Vista) => void }) {
  return (
    <div className="flex flex-1 min-h-0 flex-col justify-center gap-4">
      <p className="text-center text-sm text-muted-foreground">¿Desde qué lado quieres mostrarme el torso?</p>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onPick('Frente')}
          className="flex cursor-pointer flex-col items-center gap-3 rounded-3xl border border-white/8 bg-card p-8 text-center transition-all active:scale-[0.97] hover:border-primary/50"
        >
          <Eye className="size-7 text-primary" aria-hidden />
          <span className="font-heading text-sm font-semibold uppercase tracking-wide text-white">Frente</span>
        </button>
        <button
          type="button"
          onClick={() => onPick('Espaldas')}
          className="flex cursor-pointer flex-col items-center gap-3 rounded-3xl border border-white/8 bg-card p-8 text-center transition-all active:scale-[0.97] hover:border-primary/50"
        >
          <EyeOff className="size-7 text-primary" aria-hidden />
          <span className="font-heading text-sm font-semibold uppercase tracking-wide text-white">Espaldas</span>
        </button>
      </div>
    </div>
  )
}

function RegionScreen({ gender, onPick }: { gender: MapGender; onPick: (r: Region) => void }) {
  return (
    <div className="grid h-full w-full flex-1 grid-cols-2 grid-rows-2 gap-3">
      {REGIONS.map(region => (
        <button
          key={region}
          type="button"
          onClick={() => onPick(region)}
          className="group relative flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-white/8 bg-card text-left transition-all active:scale-[0.97] hover:border-primary/50"
        >
          <span className="relative block min-h-0 w-full flex-1 overflow-hidden bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={regionImage(gender, region)} alt={region} loading="lazy" className="size-full object-contain transition-transform duration-300 group-hover:scale-[1.03]" />
          </span>
          <span className="block shrink-0 px-3 py-2.5 text-center font-heading text-xs font-semibold uppercase tracking-wide text-white">
            {region}
          </span>
        </button>
      ))}
    </div>
  )
}

type Opt = { key: string; label: string; image: string }

function GroupPicker({ title, options, onPick }: { title: string; options: Opt[]; onPick: (key: string) => void }) {
  return (
    <div className="flex flex-1 min-h-0 flex-col gap-3">
      <p className="shrink-0 text-sm text-muted-foreground">{title}</p>
      <div className="grid h-full w-full flex-1 grid-cols-2 grid-rows-1 gap-3">
        {options.map(o => (
          <button
            key={o.key}
            type="button"
            onClick={() => onPick(o.key)}
            className="group relative flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-white/8 bg-card text-left transition-all active:scale-[0.97] hover:border-primary/50"
          >
            <span className="relative block min-h-0 w-full flex-1 overflow-hidden bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={o.image} alt={o.label} loading="lazy" className="size-full object-contain" />
            </span>
            <span className="block shrink-0 px-3 py-2.5 text-center font-heading text-xs font-semibold uppercase tracking-wide text-white">
              {o.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function LadoPicker({ options, onPick }: { options: Opt[]; onPick: (key: string) => void }) {
  return (
    <div className="flex flex-1 min-h-0 flex-col gap-3">
      <p className="shrink-0 text-center text-sm text-muted-foreground">¿Qué lado?</p>
      <div className="grid h-full w-full flex-1 grid-cols-2 grid-rows-1 gap-3">
        {options.map(o => (
          <button
            key={o.key}
            type="button"
            onClick={() => onPick(o.key)}
            className="group relative flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-white/8 bg-card text-left transition-all active:scale-[0.97] hover:border-primary/50"
          >
            <span className="relative block min-h-0 w-full flex-1 overflow-hidden bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={o.image} alt={o.label} loading="lazy" className="size-full object-contain" />
            </span>
            <span className="block shrink-0 px-3 py-2.5 text-center font-heading text-xs font-semibold uppercase tracking-wide text-white">
              {o.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ProfundidadPicker({ options, onPick }: { options: Opt[]; onPick: (key: string) => void }) {
  return (
    <div className="flex flex-1 min-h-0 flex-col gap-3">
      <p className="shrink-0 text-center text-sm text-muted-foreground">¿Parte externa o interna?</p>
      <div className="grid h-full w-full flex-1 grid-cols-2 grid-rows-1 gap-3">
        {options.map(o => (
          <button
            key={o.key}
            type="button"
            onClick={() => onPick(o.key)}
            className="group relative flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-white/8 bg-card text-left transition-all active:scale-[0.97] hover:border-primary/50"
          >
            <span className="relative block min-h-0 w-full flex-1 overflow-hidden bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={o.image} alt={o.label} loading="lazy" className="size-full object-contain" />
            </span>
            <span className="block shrink-0 px-3 py-2.5 text-center font-heading text-xs font-semibold uppercase tracking-wide text-white">
              {o.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ItemGrid({ options, onPick }: { options: Opt[]; onPick: (key: string, label: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null)
  const cols = 3
  const rows = Math.ceil(options.length / cols)
  return (
    <div
      className="grid h-full w-full flex-1 gap-2"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}
    >
      {options.map(o => {
        const active = selected === o.key
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => { setSelected(o.key); onPick(o.key, o.label) }}
            className={`group relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border bg-card text-left transition-all active:scale-[0.97] ${
              active ? 'border-primary shadow-[0_0_0_1px_var(--primary)]' : 'border-white/8 hover:border-primary/50'
            }`}
          >
            <span className="relative block min-h-0 w-full flex-1 overflow-hidden bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={o.image} alt={o.label} loading="lazy" className="size-full object-contain transition-transform duration-300 group-hover:scale-[1.03]" />
              {active && (
                <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3" strokeWidth={3} aria-hidden />
                </span>
              )}
            </span>
            <span className="block shrink-0 px-1.5 py-1.5 text-center font-heading text-[11px] font-semibold leading-tight uppercase tracking-wide text-white">
              {o.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
