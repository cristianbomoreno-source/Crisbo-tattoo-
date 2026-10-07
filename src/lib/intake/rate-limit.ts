type Bucket = { count: number; resetAt: number }

/** Límite de intentos por clave en una ventana fija, en memoria.
 * Suficiente para v1: en serverless cada instancia tiene su propio mapa. */
export class RateLimiter {
  private buckets = new Map<string, Bucket>()
  constructor(
    private max: number,
    private windowMs: number
  ) {}

  allow(key: string, now: number = Date.now()): boolean {
    const bucket = this.buckets.get(key)
    if (!bucket || now >= bucket.resetAt) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs })
      return true
    }
    if (bucket.count >= this.max) return false
    bucket.count += 1
    return true
  }
}
