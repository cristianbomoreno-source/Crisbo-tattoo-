/** Decide a dónde mandar a alguien recién autenticado.
 * En Crisbo Tattoo (single-studio), siempre va directo al dashboard. */
export async function resolvePostAuthPath(): Promise<string> {
  // Single-studio: siempre ir al dashboard
  return '/dashboard'
}
