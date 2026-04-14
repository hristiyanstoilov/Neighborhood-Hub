import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, FlatList, TextInput } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../../lib/api'
import {
  aiConversationKeys,
  deleteConversationById,
  fetchConversationMessages,
  fetchConversations,
  type ChatConversation,
  type ChatMessage,
} from '../../../lib/queries/ai-conversations'

export function useChatScreenState(input: { userId?: string }) {
  const queryClient = useQueryClient()
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [activeConvTitle, setActiveConvTitle] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [textInput, setTextInput] = useState('')
  const [sending, setSending] = useState(false)

  const flatListRef = useRef<FlatList>(null)
  const inputRef = useRef<TextInput>(null)

  const conversationsQuery = useQuery({
    queryKey: aiConversationKeys.list(input.userId ?? ''),
    queryFn: fetchConversations,
    enabled: Boolean(input.userId),
    staleTime: aiConversationKeys.staleTimeMs,
  })

  const messagesQuery = useQuery({
    queryKey: aiConversationKeys.messages(activeConvId ?? ''),
    queryFn: () => fetchConversationMessages(activeConvId as string),
    enabled: Boolean(input.userId && activeConvId),
    staleTime: aiConversationKeys.staleTimeMs,
  })

  const deleteConversationMutation = useMutation({
    mutationFn: deleteConversationById,
    onSuccess: async (_result, deletedId) => {
      await queryClient.invalidateQueries({ queryKey: aiConversationKeys.all })
      if (activeConvId === deletedId) {
        setActiveConvId(null)
        setMessages([])
      }
    },
  })

  useFocusEffect(
    useCallback(() => {
      if (!input.userId) {
        setActiveConvId(null)
        setMessages([])
        return
      }

      if (!conversationsQuery.isLoading) {
        void conversationsQuery.refetch()
      }
    }, [conversationsQuery.isLoading, conversationsQuery.refetch, input.userId])
  )

  useEffect(() => {
    if (activeConvId && messagesQuery.data) {
      setMessages(messagesQuery.data)
    }
  }, [activeConvId, messagesQuery.data])

  useEffect(() => {
    if (!activeConvId) {
      setActiveConvTitle('')
      return
    }

    const thisConversation = (conversationsQuery.data ?? []).find((conv) => conv.id === activeConvId)
    if (thisConversation) {
      setActiveConvTitle(thisConversation.title ?? 'Conversation')
    }
  }, [activeConvId, conversationsQuery.data])

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80)
    }
  }, [messages])

  async function openConversation(conv: ChatConversation) {
    setActiveConvId(conv.id)
    setActiveConvTitle(conv.title ?? 'Conversation')
    setMessages([])
    await messagesQuery.refetch()
  }

  function startNewConversation() {
    setActiveConvId(null)
    setActiveConvTitle('')
    setMessages([])
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  async function requestDeleteConversation(id: string) {
    Alert.alert('Delete conversation', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteConversationMutation.mutateAsync(id).catch(() => {})
        },
      },
    ])
  }

  async function sendText(text: string) {
    if (!text || sending) return
    setSending(true)

    const optimisticId = `opt-${Date.now()}`
    const placeholderId = `ph-${Date.now()}`

    setMessages((prev) => [
      ...prev,
      { id: optimisticId, role: 'user', content: text },
      { id: placeholderId, role: 'assistant', content: '', pending: true },
    ])

    try {
      const res = await apiFetch('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: text, ...(activeConvId ? { conversationId: activeConvId } : {}) }),
      })
      const json = await res.json()

      if (!res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId && m.id !== placeholderId))
        const msgs: Record<string, string> = {
          TOO_MANY_REQUESTS: 'Hourly limit reached (20 messages). Try again later.',
          AI_UNAVAILABLE: 'AI is temporarily unavailable.',
          CONVERSATION_NOT_FOUND: 'Conversation not found.',
        }
        Alert.alert('Error', msgs[json.error] ?? 'Something went wrong.')
        return
      }

      const { conversationId, message: assistantMsg } = json.data

      setMessages((prev) =>
        prev.map((m) =>
          m.id === placeholderId
            ? { id: assistantMsg.id, role: 'assistant', content: assistantMsg.content, createdAt: assistantMsg.createdAt }
            : m
        )
      )

      if (!activeConvId) {
        setActiveConvId(conversationId)
        const refreshed = await conversationsQuery.refetch()
        const convs = refreshed.data ?? []
        const thisConversation = convs.find((conv) => conv.id === conversationId)
        setActiveConvTitle(thisConversation?.title ?? 'New conversation')
      } else {
        await queryClient.invalidateQueries({ queryKey: aiConversationKeys.all })
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId && m.id !== placeholderId))
      Alert.alert('Error', 'Network error. Please check your connection.')
    } finally {
      setSending(false)
    }
  }

  function handleSend() {
    const text = textInput.trim()
    if (!text || sending) return
    setTextInput('')
    void sendText(text)
  }

  return {
    activeConvId,
    activeConvTitle,
    messages,
    input: textInput,
    sending,
    setInput: setTextInput,
    handleSend,
    sendText,
    openConversation,
    startNewConversation,
    closeConversation: () => {
      setActiveConvId(null)
      setMessages([])
    },
    requestDeleteConversation,
    conversations: conversationsQuery.data ?? [],
    loadingConvs: conversationsQuery.isLoading,
    loadingMsgs: messagesQuery.isLoading,
    messagesError: messagesQuery.isError ? 'Could not load messages for this conversation.' : null,
    inputRef,
    flatListRef,
  }
}