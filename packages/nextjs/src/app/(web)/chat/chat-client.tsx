'use client'

import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth'
import { ChatSidebar } from './_components/chat-sidebar'
import { ChatMessageList } from './_components/chat-message-list'
import { ChatComposer } from './_components/chat-composer'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast'
import {
  chatKeys,
  deleteChatConversation,
  fetchAiSummary,
  fetchChatConversations,
  fetchChatRecommendations,
  fetchConversationMessages,
  sendChatMessage,
  type ChatConversation,
  type ChatMessage,
  type RecommendedSkill,
} from './_lib/chat-queries'

export default function ChatClient() {
  const { user, loading } = useAuth()
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ChatConversation | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const viewerId = user?.id ?? 'anonymous'
  const conversationsQueryKey = chatKeys.conversations(viewerId)
  const recommendationsQueryKey = chatKeys.recommendations(viewerId)
  const summaryQueryKey = chatKeys.summary(viewerId)

  const {
    data: conversations = [],
    isLoading: loadingConvs,
  } = useQuery<ChatConversation[]>({
    queryKey: conversationsQueryKey,
    enabled: !loading && !!user,
    queryFn: fetchChatConversations,
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
    queryFn: fetchChatRecommendations,
  })

  const { data: aiSummary = null } = useQuery<string | null>({
    queryKey: summaryQueryKey,
    enabled: !loading && !!user,
    staleTime: 5 * 60_000,
    retry: 0,
    queryFn: fetchAiSummary,
  })

  const messagesQuery = useQuery<ChatMessage[]>({
    queryKey: chatKeys.messages(activeConvId ?? ''),
    queryFn: () => fetchConversationMessages(activeConvId as string),
    enabled: Boolean(activeConvId),
  })

  const deleteConversationMutation = useMutation({
    mutationFn: deleteChatConversation,
    onSuccess: async (_result, deletedId) => {
      queryClient.setQueryData<ChatConversation[]>(conversationsQueryKey, (prev = []) =>
        prev.filter((conversation) => conversation.id !== deletedId)
      )

      if (activeConvId === deletedId) {
        setActiveConvId(null)
        setMessages([])
      }

      await queryClient.invalidateQueries({ queryKey: conversationsQueryKey })
    },
  })

  const sendMutation = useMutation({
    mutationFn: sendChatMessage,
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

  function loadConversation(id: string) {
    setActiveConvId(id)
    setMessages([])
    setError(null)
  }

  function startNewConversation() {
    setActiveConvId(null)
    setMessages([])
    setError(null)
    inputRef.current?.focus()
  }

  async function deleteConversation() {
    if (!deleteTarget) return
    const currentTarget = deleteTarget
    try {
      await deleteConversationMutation.mutateAsync(currentTarget.id)

      showToast({
        variant: 'success',
        title: 'Conversation deleted',
        message: currentTarget.title ? `"${currentTarget.title}" was removed.` : 'The conversation was removed.',
      })
    } catch (mutationError) {
      const code = mutationError instanceof Error ? mutationError.message : 'UNKNOWN_ERROR'
      showToast({
        variant: 'error',
        title: 'Conversation not deleted',
        message: code === 'CONVERSATION_NOT_FOUND' ? 'The conversation was already removed.' : 'Please try again.',
      })
    } finally {
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
      const response = await sendMutation.mutateAsync({
        message: text,
        ...(activeConvId ? { conversationId: activeConvId } : {}),
      })
      const { conversationId, assistantMessage } = response

      // Replace placeholder with real assistant message
      setMessages((prev) =>
        prev.map((m) =>
          m.id === placeholderId
            ? assistantMessage
            : m
        )
      )

      // Update conversation list
      if (!activeConvId) {
        setActiveConvId(conversationId)
        await queryClient.invalidateQueries({ queryKey: conversationsQueryKey })
        await queryClient.invalidateQueries({ queryKey: chatKeys.messages(conversationId) })
      } else {
        queryClient.setQueryData<ChatConversation[]>(conversationsQueryKey, (prev = []) =>
          prev
            .map((c) => (c.id === conversationId ? { ...c, updatedAt: new Date().toISOString() } : c))
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        )
        await queryClient.invalidateQueries({ queryKey: chatKeys.messages(conversationId) })
      }
    } catch (mutationError) {
      const code = mutationError instanceof Error ? mutationError.message : 'UNKNOWN_ERROR'
      const msgs: Record<string, string> = {
        TOO_MANY_REQUESTS: 'You have reached the hourly limit (20 messages). Please try again later.',
        AI_UNAVAILABLE: 'The AI service is temporarily unavailable. Please try again.',
        CONVERSATION_NOT_FOUND: 'This conversation no longer exists.',
      }
      setError(msgs[code] ?? 'Something went wrong. Please try again.')
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId && m.id !== placeholderId))
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

  useEffect(() => {
    if (!activeConvId) {
      return
    }

    if (messagesQuery.data) {
      setMessages(messagesQuery.data)
    }
  }, [activeConvId, messagesQuery.data])

  useEffect(() => {
    if (messagesQuery.isError) {
      setError('Could not load conversation messages. Please retry.')
    }
  }, [messagesQuery.isError])

  const loadingMsgs = Boolean(activeConvId && messagesQuery.isLoading)

  return (
    <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[500px]">
      <ChatSidebar
        conversations={conversations}
        activeConvId={activeConvId}
        loadingConvs={loadingConvs}
        loadingRecommendations={loadingRecommendations}
        recommendationsError={recommendationsError}
        recommendations={recommendations}
        aiSummary={aiSummary}
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
            { icon: 'refresh', text: 'How do skill requests work?' },
            { icon: 'idea', text: 'What skills can I offer?' },
            { icon: 'radar', text: 'What is the Neighborhood Radar?' },
            { icon: 'rocket', text: 'How do I get started?' },
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
        busy={deleteConversationMutation.isPending}
      />
    </div>
  )
}
