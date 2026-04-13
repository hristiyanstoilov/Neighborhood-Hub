export const QUERY_DEFAULTS = {
  shortStaleTimeMs: 15_000,
  mediumStaleTimeMs: 60_000,
  longStaleTimeMs: 5 * 60_000,
} as const

export function readQueryErrorCode(json: unknown): string {
  if (json && typeof json === 'object' && 'error' in json && typeof (json as { error?: unknown }).error === 'string') {
    return (json as { error: string }).error
  }

  return 'UNKNOWN_ERROR'
}