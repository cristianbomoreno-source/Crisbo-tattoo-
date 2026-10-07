const USERNAME_RE = /^[a-z0-9_.]{3,20}$/

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase()
}

export function isValidUsername(username: string): boolean {
  return USERNAME_RE.test(username)
}

/** Correo sintético para autenticar con Supabase Auth (que exige correo).
 * Nunca se envía nada a esta dirección: la cuenta se crea ya confirmada
 * con el service role (ver signUpWithUsername). */
export function usernameToEmail(username: string): string {
  return `${username}@user.ofink.app`
}
