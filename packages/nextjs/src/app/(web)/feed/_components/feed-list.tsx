'use client'

import Link from 'next/link'
import { useInfiniteQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { formatDateTime } from '@/lib/format'
import { queryKeys } from '@/lib/query-keys'

type FeedEventType = 'skill_listed' | 'tool_listed' | 'food_shared' | 'drive_opened' | 'event_created'

type FeedItem = {
  id: string
  actorName: string
  eventType: FeedEventType
  targetTitle: string
  targetUrl: string
  createdAt: string
}

type FeedResponse = {
  items: FeedItem[]
  total: number
}

function formatVerb(eventType: FeedEventType) {
  if (eventType === 'skill_listed') return 'listed a new skill'
  if (eventType === 'tool_listed') return 'added a tool'
  if (eventType === 'food_shared') return 'shared food'
  if (eventType === 'drive_opened') return 'started a drive'
  return 'created an event'
}

async function fetchFeedPage(offset: number): Promise<FeedResponse> {
  const res = await apiFetch(`/api/feed?limit=20&offset=${offset}`)
  const json = await res.json().catch(() => null)

  if (!res.ok || !json?.data) {
    throw new Error('FEED_FETCH_FAILED')
  }

  return json.data as FeedResponse
}

export function FeedList() {
  const query = useInfiniteQuery({
    queryKey: queryKeys.feed.list,
    queryFn: ({ pageParam }) => fetchFeedPage(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.flatMap((page) => page.items).length
      return loaded < lastPage.total ? loaded : undefined
    },
  })

  if (query.isLoading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-live="polite">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-16 rounded-lg bg-gray-100 animate-pulse" />
        ))}
      </div>
    )
  }

  if (query.isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Failed to load feed. Please refresh.
      </div>
    )
  }

  const items = query.data?.pages.flatMap((page) => page.items) ?? []

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-600">
        No activity yet. Be the first to share something!
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article key={item.id} className="rounded-lg border border-gray-200 bg-white px-4 py-3">
          <p className="text-sm text-gray-900">
            <span className="font-semibold">{item.actorName}</span> {formatVerb(item.eventType)}:{' '}
            <Link href={item.targetUrl} className="font-medium text-green-700 hover:underline">
              {item.targetTitle}
            </Link>
          </p>
          <p className="mt-1 text-xs text-gray-500">{formatDateTime(item.createdAt)}</p>
        </article>
      ))}

      {query.hasNextPage && (
        <button
          type="button"
          onClick={() => void query.fetchNextPage()}
          disabled={query.isFetchingNextPage}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {query.isFetchingNextPage ? 'Loading...' : 'Load more'}
        </button>
      )}
    </div>
  )
}
