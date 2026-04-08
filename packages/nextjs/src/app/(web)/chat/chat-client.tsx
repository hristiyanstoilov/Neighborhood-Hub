'use client'

import { useEffect, useRef, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { ChatSidebar } from './_components/chat-sidebar'
import { ChatMessageList } from './_components/chat-message-list'
import { ChatComposer } from './_components/chat-composer'

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
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Load conversation list on mount
  useEffect(() => {
    async function loadConversations() {
      try {
        const res = await apiFetch('/api/ai/conversations')
        if (res.ok) {
          const json = await res.json()
          setConversations(json.data ?? [])
        }
      } finally {
        setLoadingConvs(false)
      }
    }
    loadConversations()
  }, [])

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

  async function deleteConversation(id: string) {
    const res = await apiFetch(`/api/ai/conversations/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (activeConvId === id) {
        setActiveConvId(null)
        setMessages([])
      }
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
      const res = await apiFetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, conversationId: activeConvId }),
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
        // Refresh conversation list to show new entry
        const convRes = await apiFetch('/api/ai/conversations')
        if (convRes.ok) {
          const convJson = await convRes.json()
          setConversations(convJson.data ?? [])
        }
      } else {
        // Update updatedAt for sorting
        setConversations((prev) =>
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
        onStartNewConversation={startNewConversation}
        onSelectConversation={loadConversation}
        onDeleteConversation={deleteConversation}
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
    </div>
  )
}
