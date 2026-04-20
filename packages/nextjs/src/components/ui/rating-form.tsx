'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { useToast } from '@/components/ui/toast'

type RatingContextType = 'skill_request' | 'tool_reservation' | 'food_reservation'

type RatingFormProps = {
  viewerId: string
  contextType: RatingContextType
  contextId: string
  ratedUserId: string
  ratedUserName: string
  profileUserId?: string
  onSuccess?: () => void
}

function scoreErrorMessage(errorCode: string) {
  const messages: Record<string, string> = {
    CONTEXT_NOT_FOUND: 'The related exchange could not be found.',
    CONTEXT_NOT_TERMINAL: 'This exchange is not complete yet.',
    NOT_A_PARTICIPANT: 'You cannot rate this exchange.',
    DUPLICATE_RATING: 'You already submitted a rating for this exchange.',
    TOO_MANY_REQUESTS: 'Too many attempts. Please wait a little.',
  }

  return messages[errorCode] ?? 'Could not submit rating.'
}

export function RatingForm({
  viewerId,
  contextType,
  contextId,
  ratedUserId,
  ratedUserName,
  profileUserId,
  onSuccess,
}: RatingFormProps) {
  const [score, setScore] = useState<number>(5)
  const [hoverScore, setHoverScore] = useState<number | null>(null)
  const [comment, setComment] = useState('')

  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const activeScore = hoverScore ?? score
  const charCount = useMemo(() => comment.length, [comment.length])

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/api/ratings', {
        method: 'POST',
        body: JSON.stringify({
          contextType,
          contextId,
          ratedUserId,
          score,
          comment: comment.trim() || undefined,
        }),
      })

      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error ?? 'UNKNOWN_ERROR')
      return json.data
    },
    onSuccess: async () => {
      showToast({
        variant: 'success',
        title: 'Rating submitted!',
        message: `Thanks for reviewing ${ratedUserName}.`,
      })

      await queryClient.invalidateQueries({
        queryKey: queryKeys.ratings.check(viewerId, contextType, contextId),
      })

      if (profileUserId) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.ratings.all,
        })
      }

      onSuccess?.()
    },
    onError: (err) => {
      const errorCode = err instanceof Error ? err.message : 'UNKNOWN_ERROR'
      showToast({
        variant: 'error',
        title: 'Could not submit rating',
        message: scoreErrorMessage(errorCode),
      })
    },
  })

  return (
    <div className="border border-amber-200 bg-amber-50 rounded-lg p-3 mt-3">
      <p className="text-sm font-medium text-amber-900 mb-2">Rate {ratedUserName}</p>

      <div className="flex items-center gap-1 mb-3">
        {Array.from({ length: 5 }).map((_, index) => {
          const star = index + 1
          const isActive = star <= activeScore
          return (
            <button
              key={star}
              type="button"
              aria-label={`Set rating to ${star}`}
              className={`text-xl leading-none ${isActive ? 'text-amber-500' : 'text-amber-200'}`}
              onMouseEnter={() => setHoverScore(star)}
              onMouseLeave={() => setHoverScore(null)}
              onClick={() => setScore(star)}
            >
              ★
            </button>
          )
        })}
      </div>

      <label className="block text-xs text-amber-900 mb-1" htmlFor={`rating-comment-${contextId}`}>
        Comment (optional)
      </label>
      <textarea
        id={`rating-comment-${contextId}`}
        value={comment}
        onChange={(event) => setComment(event.target.value.slice(0, 500))}
        rows={3}
        maxLength={500}
        className="w-full rounded-md border border-amber-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
        placeholder="Share a short review"
      />

      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-amber-800">{charCount}/500</span>
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium disabled:opacity-60"
        >
          {mutation.isPending ? 'Submitting…' : 'Submit rating'}
        </button>
      </div>
    </div>
  )
}
