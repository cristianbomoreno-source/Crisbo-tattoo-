import { err, type Result } from '@/lib/errors/types'

type PgError = { code?: string; message: string; details?: string | null }

/** Mensajes por constraint FK conocida (violación 23503 al borrar). */
const FK_MESSAGES: Record<string, string> = {
  consents_client_id_fkey:
    'No puedes eliminar este cliente: tiene consentimientos firmados.',
  projects_client_id_fkey:
    'No puedes eliminar este cliente: tiene proyectos asociados.',
  quotes_artist_id_fkey: 'No puedes eliminar: hay cotizaciones asociadas.',
  projects_artist_id_fkey: 'No puedes eliminar: hay proyectos asociados.',
  sessions_artist_id_fkey: 'No puedes eliminar: hay sesiones asociadas.',
}

/**
 * Traduce errores de Postgres a mensajes en español para el usuario.
 * El mensaje crudo (en inglés, con nombres de tablas/constraints) solo
 * va al log del servidor — no al toast.
 */
export function dbError(error: PgError): Result<never> {
  console.error('[db]', error.code ?? '?', error.message)

  switch (error.code) {
    case '23503': {
      const match = Object.entries(FK_MESSAGES).find(([name]) =>
        `${error.message} ${error.details ?? ''}`.includes(name)
      )
      return err(
        'DB_ERROR',
        match?.[1] ?? 'No se puede completar: hay registros relacionados.'
      )
    }
    case '23505':
      return err('DB_ERROR', 'Ya existe un registro con ese valor.')
    case '23514':
      return err('DB_ERROR', 'Alguno de los valores está fuera del rango permitido.')
    case '22003':
      return err('DB_ERROR', 'El valor numérico es demasiado grande.')
    default:
      // Neutro a propósito: `dbError` cubre lecturas y escrituras.
      return err('DB_ERROR', 'Ocurrió un error. Intenta de nuevo.')
  }
}
