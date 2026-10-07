'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/** Indicativos de países de Latinoamérica (+ España, por si algún cliente
 * escribe desde ahí). Colombia va primero: es el mercado principal de OFINK. */
export const LATAM_COUNTRY_CODES = [
  { code: '+57', country: 'CO', flag: '🇨🇴', name: 'Colombia' },
  { code: '+52', country: 'MX', flag: '🇲🇽', name: 'México' },
  { code: '+54', country: 'AR', flag: '🇦🇷', name: 'Argentina' },
  { code: '+56', country: 'CL', flag: '🇨🇱', name: 'Chile' },
  { code: '+51', country: 'PE', flag: '🇵🇪', name: 'Perú' },
  { code: '+593', country: 'EC', flag: '🇪🇨', name: 'Ecuador' },
  { code: '+58', country: 'VE', flag: '🇻🇪', name: 'Venezuela' },
  { code: '+591', country: 'BO', flag: '🇧🇴', name: 'Bolivia' },
  { code: '+595', country: 'PY', flag: '🇵🇾', name: 'Paraguay' },
  { code: '+598', country: 'UY', flag: '🇺🇾', name: 'Uruguay' },
  { code: '+507', country: 'PA', flag: '🇵🇦', name: 'Panamá' },
  { code: '+506', country: 'CR', flag: '🇨🇷', name: 'Costa Rica' },
  { code: '+502', country: 'GT', flag: '🇬🇹', name: 'Guatemala' },
  { code: '+504', country: 'HN', flag: '🇭🇳', name: 'Honduras' },
  { code: '+503', country: 'SV', flag: '🇸🇻', name: 'El Salvador' },
  { code: '+505', country: 'NI', flag: '🇳🇮', name: 'Nicaragua' },
  { code: '+1', country: 'DO', flag: '🇩🇴', name: 'Rep. Dominicana' },
  { code: '+53', country: 'CU', flag: '🇨🇺', name: 'Cuba' },
  { code: '+55', country: 'BR', flag: '🇧🇷', name: 'Brasil' },
  { code: '+34', country: 'ES', flag: '🇪🇸', name: 'España' },
] as const

const DEFAULT_CODE = '+57'

/** Separa un teléfono guardado como "+57 300 123 4567" en indicativo + número.
 * Si no reconoce el indicativo, asume el default y deja el número tal cual. */
function splitPhone(value: string): { dialCode: string; number: string } {
  const trimmed = value.trim()
  const match = LATAM_COUNTRY_CODES
    .slice()
    .sort((a, b) => b.code.length - a.code.length)
    .find((c) => trimmed.startsWith(c.code))
  if (match) return { dialCode: match.code, number: trimmed.slice(match.code.length).trim() }
  return { dialCode: DEFAULT_CODE, number: trimmed }
}

/**
 * Input de teléfono con selector de indicativo (banderas LatAm). Expone un
 * único string combinado ("+57 300 123 4567") vía onChange, para no tocar el
 * schema/validaciones (`phone` sigue siendo un solo campo).
 */
export function PhoneInput({
  value,
  onChange,
  onBlur,
  placeholder = '300 123 4567',
  id,
}: {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  id?: string
}) {
  const { dialCode, number } = splitPhone(value ?? '')

  function update(nextDialCode: string, nextNumber: string) {
    const digits = nextNumber.trim()
    onChange(digits ? `${nextDialCode} ${digits}` : '')
  }

  return (
    <div className="flex gap-2">
      {/* base-ui puede emitir null al deseleccionar; sin el guard el indicativo
          se concatenaba como "null 3502046957" en el teléfono guardado. */}
      <Select value={dialCode} onValueChange={(v) => v !== null && update(v, number)}>
        <SelectTrigger className="w-[5.75rem] shrink-0" aria-label="Indicativo del país">
          <SelectValue>
            {LATAM_COUNTRY_CODES.find((c) => c.code === dialCode)?.flag ?? '🏳️'} {dialCode}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {LATAM_COUNTRY_CODES.map((c) => (
            <SelectItem key={c.country} value={c.code}>
              <span className="mr-1">{c.flag}</span>
              {c.name} <span className="text-muted-foreground">{c.code}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        value={number}
        onChange={(e) => update(dialCode, e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className={cn(
          'h-9 min-w-0 flex-1 rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'
        )}
      />
    </div>
  )
}
