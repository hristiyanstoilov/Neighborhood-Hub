import { apiFetch } from '../api'

export type RatingContextType = 'skill_request' | 'tool_reservation' | 'food_reservation'

export type RatingCheckResponse = {
  hasRated: boolean
  existingRating: {
    id: string
    score: number
    comment: string | null
    createdAt: string
  } | null
}

export type PublicRatingRow = {
  id: string
  raterId: string
  score: number
  comment: string | null
  contextType: RatingContextType
  contextId: string
  createdAt: string
  raterName: string | null
  raterAvatarUrl: string | null
}

export const ratingsKeys = {
  all: ['ratings'] as const,
  check: (userId: string, contextType: RatingContextType, contextId: string) =>
    [...ratingsKeys.all, 'check', userId, contextType, contextId] as const,
  byUser: (userId: string, limit = 5, offset = 0) =>
    [...ratingsKeys.all, 'by-user', userId, limit, offset] as const,
}

function readErrorCode(json: unknown): string {
  if (json && typeof json === 'object' && 'error' in json && typeof (json as { error?: unknown }).error === 'string') {
    return (json as { error: string }).error
  }
  return 'UNKNOWN_ERROR'
}

export async function fetchRatingCheck(contextType: RatingContextType, contextId: string): Promise<RatingCheckResponse> {
  const params = new URLSearchParams({ contextType, contextId })
  const res = await apiFetch(`/api/ratings/check?${params.toString()}`)
  const json = await res.json().catch(() => null)
  if (!res.ok) throw new Error(readErrorCode(json))
  return (json?.data ?? { hasRated: false, existingRating: null }) as RatingCheckResponse
}

export async function createRating(input: {
  contextType: RatingContextType
  contextId: string
  ratedUserId: string
  score: number
  comment?: string
}) {
  const res = await apiFetch('/api/ratings', {
    method: 'POST',
    body: JSON.stringify({
      contextType: input.contextType,
      contextId: input.contextId,
      ratedUserId: input.ratedUserId,
      score: input.score,
      comment: input.comment?.trim() ? input.comment.trim() : undefined,
    }),
  })

  const json = await res.json().catch(() => null)
  if (!res.ok) throw new Error(readErrorCode(json))
  return json?.data
}

export async function fetchRatingsByUser(userId: string, limit = 5, offset = 0): Promise<{
  ratings: PublicRatingRow[]
  total: number
}> {
  const params = new URLSearchParams({
    userId,
    limit: String(limit),
    offset: String(offset),
  })

  const res = await apiFetch(`/api/ratings?${params.toString()}`)
  const json = await res.json().catch(() => null)
  if (!res.ok) throw new Error(readErrorCode(json))

  return {
    ratings: (json?.data?.ratings ?? []) as PublicRatingRow[],
    total: Number(json?.data?.total ?? 0),
  }
}
