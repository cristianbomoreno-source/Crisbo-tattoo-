export type AppErrorCode =
  | 'VALIDATION_ERROR'
  | 'DB_ERROR'
  | 'AUTH_ERROR'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'UNKNOWN_ERROR'

export type AppError = {
  code: AppErrorCode
  message: string
  details?: unknown
}

export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: AppError }

export function ok<T>(data: T): Result<T> {
  return { success: true, data }
}

export function err(code: AppErrorCode, message: string, details?: unknown): Result<never> {
  return { success: false, error: { code, message, details } }
}
