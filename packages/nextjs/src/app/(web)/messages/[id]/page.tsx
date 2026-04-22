'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { formatDateTime } from '@/lib/format'
import { queryKeys } from '@/lib/query-keys'
import { useAuth } from '@/contexts/auth'
import { useToast } from '@/components/ui/toast'

type MessageItem = {
  id: string
  conversationId: string
  senderId: string
  body: string
  readAt: string | null
  createdAt: string
}

type MessagesResponse = {
  messages: MessageItem[]
  hasMore: boolean
}

async function fetchMessagesPage(conversationId: string, before?: string): Promise<MessagesResponse> {
  const params = new URLSearchParams({ limit: '30' })
  if (before) params.set('before', before)

  const res = await apiFetch(`/api/conversations/${conversationId}/messages?${params.toString()}`)
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.data) throw new Error('MESSAGES_FETCH_FAILED')
  return json.data as MessagesResponse
}

export default function ConversationThreadPage() {
  const params = useParams<{ id: string }>()
  const conversationId = params.id
  const { user, loading: authLoading } = useAuth()
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const [text, setText] = useState('')

  const query = useInfiniteQuery({
    queryKey: queryKeys.directMessages.messages(conversationId),
    queryFn: ({ pageParam }) => fetchMessagesPage(conversationId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore || lastPage.messages.length === 0) return undefined
      return lastPage.messages[lastPage.messages.length - 1]?.createdAt
    },
    enabled: Boolean(conversationId) && Boolean(user),
    refetchInterval: 15_000,
  })

  const sendMutation = useMutation({
    mutationFn: async (body: string) => {
      const res = await apiFetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.data?.message) throw new Error('SEND_FAILED')
      return json.data.message as MessageItem
    },
    onSuccess: () => {
      setText('')
      void queryClient.invalidateQueries({ queryKey: queryKeys.directMessages.messages(conversationId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.directMessages.conversations(user?.id ?? 'guest') })
    },
  })

  const orderedMessages = useMemo(() => {
    const newestFirst = query.data?.pages.flatMap((page) => page.messages) ?? []
    return [...newestFirst].reverse()
  }, [query.data])

  async function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload = text.trim()
    if (!payload) return
    try {
      await sendMutation.mutateAsync(payload)
    } catch {
      showToast({ variant: 'error', title: 'Could not send message. Please try again.' })
    }
  }

  if (authLoading) return <p className="text-sm text-gray-500">Loading...</p>

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-700">
        Please log in to view this conversation.
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/messages" className="text-sm text-gray-500 hover:text-gray-700">← Messages</Link>
        <h1 className="text-2xl font-bold text-gray-900">Conversation</h1>
      </div>

      {query.hasNextPage && (
        <button
          type="button"
          onClick={() => void query.fetchNextPage()}
          disabled={query.isFetchingNextPage}
          className="mb-3 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {query.isFetchingNextPage ? 'Loading...' : 'Load older messages'}
        </button>
      )}

      <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-4">
        {query.isLoading && <p className="text-sm text-gray-500">Loading messages...</p>}
        {query.isError && <p className="text-sm text-red-600">Failed to load messages.</p>}

        {orderedMessages.map((message) => {
          const own = message.senderId === user?.id
          return (
            <div key={message.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${own ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'}`}>
                <p>{message.body}</p>
                <p className={`mt-1 text-[11px] ${own ? 'text-gray-300' : 'text-gray-500'}`}>
                  {formatDateTime(message.createdAt)}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <form onSubmit={handleSend} className="mt-4 flex flex-col gap-2">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={2000}
          rows={3}
          placeholder="Write a message"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <div>
          <button
            type="submit"
            disabled={sendMutation.isPending}
            className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-60"
          >
            {sendMutation.isPending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  )
}
