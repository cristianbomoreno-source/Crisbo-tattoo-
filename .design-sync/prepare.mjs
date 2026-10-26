// Prepara el "paquete" del sistema de diseño antes de package-build:
//  1. Tipos: tsc emite los .d.ts del punto de entrada a .cache/types y se
//     reescriben los alias `@/` a rutas relativas (el lector de tipos del
//     sincronizador no conoce los alias del tsconfig). Quedan en entry/types
//     porque el sincronizador solo toma como propias las props declaradas
//     dentro de la carpeta del paquete.
//  2. Estilos: globals.css de la app + letras, compilado por Tailwind 4 a
//     entry/dist/crisbo.css.
import { execSync } from 'node:child_process'
import { mkdirSync, rmSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'
import tailwind from '@tailwindcss/postcss'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')

// 1. Tipos
const typesDir = resolve(here, 'entry/types')
rmSync(typesDir, { recursive: true, force: true })
execSync(`npx tsc -p ${JSON.stringify(join(here, 'tsconfig.dts.json'))}`, { cwd: root, stdio: 'inherit' })
const walk = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]))
let rewritten = 0
for (const file of walk(typesDir).filter((f) => f.endsWith('.d.ts'))) {
  const text = readFileSync(file, 'utf8')
  const out = text.replace(/(from\s+|import\()(['"])@\/([^'"]+)\2/g, (_m, pre, q, p) => {
    let rel = relative(dirname(file), join(typesDir, 'src', p)).split(sep).join('/')
    if (!rel.startsWith('.')) rel = './' + rel
    return `${pre}${q}${rel}${q}`
  })
  if (out !== text) {
    writeFileSync(file, out)
    rewritten++
  }
}
// Raíz de tipos que el sincronizador lee (types/index.d.ts dentro del paquete).
writeFileSync(join(typesDir, 'index.d.ts'), "export * from './.design-sync/entry/index'\n")
console.log(`types: ${rewritten} archivos con alias @/ reescritos`)

// 2. Estilos
const from = resolve(here, 'entry/crisbo.css')
const to = resolve(here, 'entry/dist/crisbo.css')
const result = await postcss([tailwind({ base: root })]).process(readFileSync(from, 'utf8'), { from, to })
mkdirSync(dirname(to), { recursive: true })
writeFileSync(to, result.css)
console.log(`crisbo.css: ${(result.css.length / 1024).toFixed(0)} KB`)
