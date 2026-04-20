'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { formatDate } from '@/lib/format'

type RatingRow = {
  id: string
  score: number
  comment: string | null
  createdAt: string
  raterName: string | null
}

const PAGE_SIZE = 5

export function PublicProfileRatings({ userId }: { userId: string }) {
  const ratingsQuery = useInfiniteQuery({
    queryKey: queryKeys.ratings.byUser(userId, PAGE_SIZE, 0),
    queryFn: async ({ pageParam }) => {
      const offset = pageParam as number
      const params = new URLSearchParams({
        userId,
        limit: String(PAGE_SIZE),
        offset: String(offset),
      })

      const res = await apiFetch(`/api/ratings?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? 'FETCH_FAILED')
      const total = Number(json.data?.total ?? 0)
      return {
        ratings: (json.data?.ratings ?? []) as RatingRow[],
        total,
        nextOffset: offset + PAGE_SIZE,
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.total <= lastPage.nextOffset) return undefined
      return lastPage.nextOffset
    },
    staleTime: 15_000,
  })

  const rows = ratingsQuery.data?.pages.flatMap((page) => page.ratings) ?? []

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Reviews</h2>

      {ratingsQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="h-20 rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : ratingsQuery.isError ? (
        <p className="text-sm text-red-600">Could not load reviews right now.</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-500">No reviews yet.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <article key={row.id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-gray-900">{row.raterName ?? 'Neighbor'}</p>
                <p className="text-xs text-amber-700 font-medium">{'★'.repeat(Math.max(0, Math.min(5, row.score)))}</p>
              </div>
              {row.comment && <p className="text-sm text-gray-700 mt-2">{row.comment}</p>}
              <p className="text-xs text-gray-500 mt-2">{formatDate(row.createdAt)}</p>
            </article>
          ))}

          {ratingsQuery.hasNextPage && (
            <button
              type="button"
              className="text-sm font-medium text-green-700 hover:text-green-800"
              onClick={() => ratingsQuery.fetchNextPage()}
            >
              Load more
            </button>
          )}
        </div>
      )}
    </section>
  )
}
