export const QUERY_DEFAULTS = {
  shortStaleTimeMs: 15_000,
  mediumStaleTimeMs: 60_000,
  longStaleTimeMs: 5 * 60_000,
} as const

/**
 * Pagination defaults for list queries across all modules.
 * Used to maintain consistency in query results and prevent pagination truncation.
 */
export const PAGINATION_DEFAULTS = {
  defaultPageSize: 20,
  defaultPageSizeFood: 50,
  defaultPageSizeReservations: 50,
  defaultPage: 1,
} as const

export const DEFAULT_PAGE = 1
export const DEFAULT_LIMIT = 20

export function readQueryErrorCode(json: unknown): string {
  if (json && typeof json === 'object' && 'error' in json && typeof (json as { error?: unknown }).error === 'string') {
    return (json as { error: string }).error
  }

  return 'UNKNOWN_ERROR'
}