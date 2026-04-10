'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/contexts/auth'
import { ChatSidebar } from './_components/chat-sidebar'
import { ChatMessageList } from './_components/chat-message-list'
import { ChatComposer } from './_components/chat-composer'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast'
import type { RecommendedSkill } from './_components/chat-sidebar'

interface Message {
  id?: string
  role: 'user' | 'assistant'
  content: string
  pending?: boolean
}

interface Conversation {
  id: string
  title: string | null
  updatedAt: string
}

export default function ChatClient() {
  const { user, loading } = useAuth()
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null)
  const [deletingConversation, setDeletingConversation] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const conversationsQueryKey = ['ai', 'conversations', user?.id ?? 'anonymous']
  const recommendationsQueryKey = ['ai', 'recommendations', user?.id ?? 'anonymous']

  const {
    data: conversations = [],
    isLoading: loadingConvs,
  } = useQuery<Conversation[]>({
    queryKey: conversationsQueryKey,
    enabled: !loading && !!user,
    queryFn: async () => {
      const res = await apiFetch('/api/ai/conversations')
      if (!res.ok) return []
      const json = await res.json()
      return json.data ?? []
    },
  })

  const {
    data: recommendations = [],
    isLoading: loadingRecommendations,
    error: recommendationsQueryError,
  } = useQuery<RecommendedSkill[]>({
    queryKey: recommendationsQueryKey,
    enabled: !loading && !!user,
    staleTime: 60_000,
    retry: 0,
    queryFn: async () => {
      const res = await apiFetch('/api/ai/recommendations?limit=5')
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        if (json?.error === 'TOO_MANY_REQUESTS') {
          throw new Error('TOO_MANY_REQUESTS')
        }
        throw new Error('RECOMMENDATIONS_UNAVAILABLE')
      }
      const json = await res.json()
      return json.data ?? []
    },
  })

  const recommendationsError = recommendationsQueryError
    ? recommendationsQueryError instanceof Error && recommendationsQueryError.message === 'TOO_MANY_REQUESTS'
      ? 'Recommendations are temporarily rate limited.'
      : 'Could not load recommendations right now.'
    : null

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadConversation(id: string) {
    setLoadingMsgs(true)
    setActiveConvId(id)
    setMessages([])
    setError(null)
    try {
      const res = await apiFetch(`/api/ai/conversations/${id}`)
      if (res.ok) {
        const json = await res.json()
        setMessages(json.data.messages ?? [])
      }
    } finally {
      setLoadingMsgs(false)
    }
  }

  function startNewConversation() {
    setActiveConvId(null)
    setMessages([])
    setError(null)
    inputRef.current?.focus()
  }

  async function deleteConversation() {
    if (!deleteTarget) return

    setDeletingConversation(true)
    try {
      const res = await apiFetch(`/api/ai/conversations/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        showToast({
          variant: 'error',
          title: 'Conversation not deleted',
          message: json?.error === 'CONVERSATION_NOT_FOUND' ? 'The conversation was already removed.' : 'Please try again.',
        })
        return
      }

      queryClient.setQueryData<Conversation[]>(conversationsQueryKey, (prev = []) =>
        prev.filter((c) => c.id !== deleteTarget.id)
      )
      if (activeConvId === deleteTarget.id) {
        setActiveConvId(null)
        setMessages([])
      }

      showToast({
        variant: 'success',
        title: 'Conversation deleted',
        message: deleteTarget.title ? `"${deleteTarget.title}" was removed.` : 'The conversation was removed.',
      })
    } catch {
      showToast({
        variant: 'error',
        title: 'Delete failed',
        message: 'Please check your connection and try again.',
      })
    } finally {
      setDeletingConversation(false)
      setDeleteTarget(null)
    }
  }

  async function handleSend(messageText?: string) {
    const text = (messageText ?? input).trim()
    if (!text || sending) return

    if (!messageText) {
      setInput('')
    }
    setError(null)
    setSending(true)

    // Optimistic user message
    const optimisticId = `opt-${Date.now()}`
    setMessages((prev) => [...prev, { id: optimisticId, role: 'user', content: text }])

    // Placeholder for assistant response
    const placeholderId = `ph-${Date.now()}`
    setMessages((prev) => [...prev, { id: placeholderId, role: 'assistant', content: '', pending: true }])

    try {
      const payload = activeConvId
        ? { message: text, conversationId: activeConvId }
        : { message: text }

      const res = await apiFetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (!res.ok) {
        const msgs: Record<string, string> = {
          TOO_MANY_REQUESTS: 'You have reached the hourly limit (20 messages). Please try again later.',
          AI_UNAVAILABLE: 'The AI service is temporarily unavailable. Please try again.',
          CONVERSATION_NOT_FOUND: 'This conversation no longer exists.',
        }
        setError(msgs[json.error] ?? 'Something went wrong. Please try again.')
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId && m.id !== placeholderId))
        return
      }

      const { conversationId, message: assistantMsg } = json.data

      // Replace placeholder with real assistant message
      setMessages((prev) =>
        prev.map((m) =>
          m.id === placeholderId
            ? { id: assistantMsg.id, role: 'assistant', content: assistantMsg.content }
            : m
        )
      )

      // Update conversation list
      if (!activeConvId) {
        setActiveConvId(conversationId)
        await queryClient.invalidateQueries({ queryKey: conversationsQueryKey })
      } else {
        queryClient.setQueryData<Conversation[]>(conversationsQueryKey, (prev = []) =>
          prev
            .map((c) => (c.id === conversationId ? { ...c, updatedAt: new Date().toISOString() } : c))
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        )
      }
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[500px]">
      <ChatSidebar
        conversations={conversations}
        activeConvId={activeConvId}
        loadingConvs={loadingConvs}
        loadingRecommendations={loadingRecommendations}
        recommendationsError={recommendationsError}
        recommendations={recommendations}
        onStartNewConversation={startNewConversation}
        onSelectConversation={loadConversation}
        onRequestDeleteConversation={setDeleteTarget}
      />

      <div className="flex-1 flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden">
        <ChatMessageList
          loadingMsgs={loadingMsgs}
          messages={messages}
          bottomRef={bottomRef}
          suggestions={[
            { icon: '🔄', text: 'How do skill requests work?' },
            { icon: '💡', text: 'What skills can I offer?' },
            { icon: '🗺️', text: 'What is the Neighborhood Radar?' },
            { icon: '🚀', text: 'How do I get started?' },
          ]}
          onSuggestionClick={handleSend}
        />

        {error && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-100">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <ChatComposer
          inputRef={inputRef}
          input={input}
          sending={sending}
          onInputChange={setInput}
          onKeyDown={handleKeyDown}
          onSend={() => handleSend()}
        />
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete conversation?"
        description={deleteTarget ? `This will permanently delete ${deleteTarget.title ?? 'this conversation'}.` : undefined}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={deleteConversation}
        onCancel={() => setDeleteTarget(null)}
        busy={deletingConversation}
      />
    </div>
  )
}
