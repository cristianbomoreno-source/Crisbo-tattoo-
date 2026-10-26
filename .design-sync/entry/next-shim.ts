// next/link lee process.env.__NEXT_* al cargarse; en la app lo reemplaza el
// compilador de Next. Fuera de Next (claude.ai/design) hay que definirlo.
const g = globalThis as { process?: { env?: Record<string, string | undefined> } }
g.process ??= {}
g.process.env ??= {}
export {}
