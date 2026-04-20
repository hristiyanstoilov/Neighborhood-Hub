import { apiFetch } from '../api'

export type FeedEventType = 'skill_listed' | 'tool_listed' | 'food_shared' | 'drive_opened' | 'event_created'

export type FeedItem = {
  id: string
  actorName: string
  eventType: FeedEventType
  targetTitle: string
  targetUrl: string
  createdAt: string
}

export type FeedPage = {
  items: FeedItem[]
  total: number
}

export const feedKeys = {
  all: ['feed'] as const,
  list: ['feed', 'list'] as const,
}

function readErrorCode(json: unknown): string {
  if (json && typeof json === 'object' && 'error' in json && typeof (json as { error?: unknown }).error === 'string') {
    return (json as { error: string }).error
  }
  return 'UNKNOWN_ERROR'
}

export async function fetchFeedPage(offset: number, limit = 20): Promise<FeedPage> {
  const res = await apiFetch(`/api/feed?limit=${limit}&offset=${offset}`)
  const json = await res.json()

  if (!res.ok || !json?.data) {
    throw new Error(readErrorCode(json))
  }

  return json.data as FeedPage
}

export function feedActionText(item: FeedItem): string {
  if (item.eventType === 'skill_listed') return `${item.actorName} listed a new skill: ${item.targetTitle}`
  if (item.eventType === 'tool_listed') return `${item.actorName} added a tool: ${item.targetTitle}`
  if (item.eventType === 'food_shared') return `${item.actorName} shared food: ${item.targetTitle}`
  if (item.eventType === 'drive_opened') return `${item.actorName} started a drive: ${item.targetTitle}`
  return `${item.actorName} created an event: ${item.targetTitle}`
}
