'use client'

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (hex: string) => void
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl bg-background px-3.5 py-2.5">
      <span className="text-sm">{label}</span>
      <span className="flex shrink-0 items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 rounded-lg bg-card px-2 py-1 text-right font-mono text-xs uppercase focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          maxLength={7}
        />
        <input
          type="color"
          value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="size-8 cursor-pointer rounded-lg border-0 bg-transparent p-0"
          aria-label={`Color: ${label}`}
        />
      </span>
    </label>
  )
}
