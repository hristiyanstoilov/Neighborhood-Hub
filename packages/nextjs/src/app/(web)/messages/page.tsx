'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth'
import { apiFetch } from '@/lib/api'
import { formatDateTime } from '@/lib/format'
import { queryKeys } from '@/lib/query-keys'

type ConversationItem = {
  id: string
  otherUserId: string
  otherUserName: string
  lastMessage: { body: string; createdAt: string } | null
  unreadCount: number
}

async function fetchConversations(): Promise<ConversationItem[]> {
  const res = await apiFetch('/api/conversations')
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.data) throw new Error('CONVERSATIONS_FETCH_FAILED')
  return json.data as ConversationItem[]
}

export default function MessagesPage() {
  const { user, loading } = useAuth()

  const query = useQuery({
    queryKey: queryKeys.directMessages.conversations(user?.id ?? 'guest'),
    queryFn: fetchConversations,
    enabled: Boolean(user),
    refetchInterval: 15_000,
  })

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>

  if (!user) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-700">
        Please log in to view your messages.
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="mt-1 text-sm text-gray-600">Your direct conversations with neighbors.</p>
        </div>
        <Link
          href="/messages/new"
          className="rounded-md bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-800"
        >
          Start a conversation
        </Link>
      </div>

      {query.isLoading && <p className="text-sm text-gray-500">Loading conversations...</p>}

      {query.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load conversations.
        </div>
      )}

      {!query.isLoading && !query.isError && query.data && query.data.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
          No conversations yet.
        </div>
      )}

      <div className="space-y-3">
        {query.data?.map((conversation) => (
          <Link
            key={conversation.id}
            href={`/messages/${conversation.id}`}
            className="block rounded-lg border border-gray-200 bg-white px-4 py-3 hover:border-green-300"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-gray-900">{conversation.otherUserName}</p>
              {conversation.unreadCount > 0 && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  {conversation.unreadCount}
                </span>
              )}
            </div>
            <p className="mt-1 truncate text-sm text-gray-600">
              {conversation.lastMessage?.body ? conversation.lastMessage.body.slice(0, 60) : 'No messages yet'}
            </p>
            {conversation.lastMessage?.createdAt && (
              <p className="mt-1 text-xs text-gray-500">{formatDateTime(conversation.lastMessage.createdAt)}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
