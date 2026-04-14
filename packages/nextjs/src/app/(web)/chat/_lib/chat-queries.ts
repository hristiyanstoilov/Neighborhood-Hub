import { apiFetch } from '@/lib/api'
import { readQueryErrorCode } from '@/lib/query-defaults'

export interface ChatConversation {
  id: string
  title: string | null
  updatedAt: string
}

export interface ChatMessage {
  id?: string
  role: 'user' | 'assistant'
  content: string
  pending?: boolean
}

export interface RecommendedSkill {
  id: string
  title: string
  categoryLabel: string | null
  locationNeighborhood: string | null
  locationCity: string | null
  ownerName: string | null
  reason: string
}

export const chatKeys = {
  all: ['ai'] as const,
  conversations: (userId: string) => [...chatKeys.all, 'conversations', userId] as const,
  recommendations: (userId: string) => [...chatKeys.all, 'recommendations', userId] as const,
  messages: (conversationId: string) => [...chatKeys.all, 'messages', conversationId] as const,
}

export async function fetchChatConversations(): Promise<ChatConversation[]> {
  const res = await apiFetch('/api/ai/conversations')
  const json = await res.json().catch(() => null)

  if (!res.ok) return []

  return Array.isArray(json?.data) ? json.data : []
}

export async function fetchChatRecommendations(): Promise<RecommendedSkill[]> {
  const res = await apiFetch('/api/ai/recommendations?limit=5')
  const json = await res.json().catch(() => null)

  if (!res.ok) {
    const code = readQueryErrorCode(json)
    if (code === 'TOO_MANY_REQUESTS') {
      throw new Error('TOO_MANY_REQUESTS')
    }
    throw new Error('RECOMMENDATIONS_UNAVAILABLE')
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

export async function deleteChatConversation(conversationId: string): Promise<void> {
  const res = await apiFetch(`/api/ai/conversations/${conversationId}`, { method: 'DELETE' })
  const json = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(readQueryErrorCode(json))
  }
}

export async function sendChatMessage(input: {
  message: string
  conversationId?: string
}): Promise<{ conversationId: string; assistantMessage: ChatMessage }> {
  const payload = input.conversationId
    ? { message: input.message, conversationId: input.conversationId }
    : { message: input.message }

  const res = await apiFetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const json = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(readQueryErrorCode(json))
  }

  return {
    conversationId: json.data.conversationId as string,
    assistantMessage: {
      id: json.data.message?.id,
      role: 'assistant',
      content: json.data.message?.content ?? '',
    },
  }
}