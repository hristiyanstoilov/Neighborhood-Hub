import { apiFetch } from '../api'

export type ConversationItem = {
  id: string
  otherUserId: string
  otherUserName: string
  lastMessage: { body: string; createdAt: string } | null
  unreadCount: number
}

export type MessageItem = {
  id: string
  conversationId: string
  senderId: string
  body: string
  readAt: string | null
  createdAt: string
}

export type MessagesPage = {
  messages: MessageItem[]
  hasMore: boolean
}

export const dmKeys = {
  all: ['direct-messages'] as const,
  conversations: (userId: string) => [...dmKeys.all, 'conversations', userId] as const,
  messages: (conversationId: string) => [...dmKeys.all, 'messages', conversationId] as const,
}

function readErrorCode(json: unknown): string {
  if (json && typeof json === 'object' && 'error' in json && typeof (json as { error?: unknown }).error === 'string') {
    return (json as { error: string }).error
  }
  return 'UNKNOWN_ERROR'
}

export async function fetchConversations(): Promise<ConversationItem[]> {
  const res = await apiFetch('/api/conversations')
  const json = await res.json().catch(() => null)

  if (!res.ok || !json?.data) {
    throw new Error(readErrorCode(json))
  }

  return json.data as ConversationItem[]
}

export async function createConversation(otherUserId: string): Promise<{ conversationId: string }> {
  const res = await apiFetch('/api/conversations', {
    method: 'POST',
    body: JSON.stringify({ otherUserId }),
  })
  const json = await res.json().catch(() => null)

  if (!res.ok || !json?.data) {
    throw new Error(readErrorCode(json))
  }

  return json.data as { conversationId: string }
}

export async function fetchMessages(conversationId: string, before?: string, limit = 30): Promise<MessagesPage> {
  const params = new URLSearchParams({ limit: String(limit) })
  if (before) params.set('before', before)

  const res = await apiFetch(`/api/conversations/${conversationId}/messages?${params.toString()}`)
  const json = await res.json().catch(() => null)

  if (!res.ok || !json?.data) {
    throw new Error(readErrorCode(json))
  }

  return json.data as MessagesPage
}

export type UserSearchResult = {
  id: string
  name: string | null
  avatarUrl: string | null
}

export async function searchUsers(q: string): Promise<UserSearchResult[]> {
  const res = await apiFetch(`/api/users/search?q=${encodeURIComponent(q)}`)
  const json = await res.json().catch(() => null)

  if (!res.ok || !json?.data) {
    throw new Error(readErrorCode(json))
  }

  return Array.isArray(json?.data?.users) ? (json.data.users as UserSearchResult[]) : []
}

export async function sendMessage(conversationId: string, body: string): Promise<MessageItem> {
  const res = await apiFetch(`/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  })
  const json = await res.json()

  if (!res.ok || !json?.data?.message) {
    throw new Error(readErrorCode(json))
  }

  return json.data.message as MessageItem
}
