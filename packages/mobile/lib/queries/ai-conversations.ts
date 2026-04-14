import { apiFetch } from '../api'
import { MOBILE_QUERY_DEFAULTS, readQueryErrorCode } from '../query-defaults'

export interface ChatMessage {
  id?: string
  role: 'user' | 'assistant'
  content: string
  pending?: boolean
  createdAt?: string
}

export interface ChatConversation {
  id: string
  title: string | null
  updatedAt: string
}

export const aiConversationKeys = {
  all: ['ai-conversations'] as const,
  list: (userId: string) => [...aiConversationKeys.all, 'list', userId] as const,
  messages: (conversationId: string) => [...aiConversationKeys.all, 'messages', conversationId] as const,
  staleTimeMs: MOBILE_QUERY_DEFAULTS.shortStaleTimeMs,
}

export async function fetchConversations(): Promise<ChatConversation[]> {
  const res = await apiFetch('/api/ai/conversations')
  const json = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(readQueryErrorCode(json))
  }

  return Array.isArray(json?.data) ? json.data : []
}

export async function fetchConversationMessages(conversationId: string): Promise<ChatMessage[]> {
  const res = await apiFetch(`/api/ai/conversations/${conversationId}`)
  const json = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(readQueryErrorCode(json))
  }

  return Array.isArray(json?.data?.messages) ? json.data.messages : []
}

export async function deleteConversationById(conversationId: string): Promise<void> {
  const res = await apiFetch(`/api/ai/conversations/${conversationId}`, { method: 'DELETE' })
  const json = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(readQueryErrorCode(json))
  }
}