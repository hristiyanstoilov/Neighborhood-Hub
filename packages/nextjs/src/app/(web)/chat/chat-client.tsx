'use client'

import { useEffect, useRef, useState } from 'react'
import { apiFetch } from '@/lib/api'

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

  async function handleSend() {
    const text = input.trim()
    if (!text || sending) return

    setInput('')
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
      {/* Sidebar — conversation history */}
      <aside className="w-56 shrink-0 flex flex-col gap-1">
        <button
          onClick={startNewConversation}
          className="w-full text-left px-3 py-2 rounded-lg bg-green-700 text-white text-sm font-medium hover:bg-green-800 transition-colors mb-2"
        >
          + New conversation
        </button>

        {loadingConvs ? (
          <p className="text-xs text-gray-400 px-2">Loading…</p>
        ) : conversations.length === 0 ? (
          <p className="text-xs text-gray-400 px-2">No conversations yet.</p>
        ) : (
          <div className="overflow-y-auto flex-1 flex flex-col gap-0.5">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center gap-1 rounded-lg px-2 py-1.5 cursor-pointer transition-colors ${
                  activeConvId === conv.id
                    ? 'bg-green-50 text-green-800'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
                onClick={() => loadConversation(conv.id)}
              >
                <span className="flex-1 text-xs line-clamp-2 leading-snug">
                  {conv.title ?? 'Untitled'}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id) }}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity text-xs px-1"
                  title="Delete"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {loadingMsgs ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-gray-400">Loading…</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-3">
              <div className="text-4xl">💬</div>
              <p className="text-gray-500 text-sm max-w-xs">
                Ask me anything about Neighborhood Hub — how to post a skill, what happens after a request, or anything else.
              </p>
              <div className="flex flex-col gap-2 w-full max-w-xs mt-2">
                {[
                  'How do skill requests work?',
                  'What skills can I offer?',
                  'How do I get started?',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => { setInput(suggestion); inputRef.current?.focus() }}
                    className="text-xs text-green-700 border border-green-200 rounded-lg px-3 py-1.5 hover:bg-green-50 transition-colors text-left"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={msg.id ?? i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-green-700 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  } ${msg.pending ? 'animate-pulse opacity-60' : ''}`}
                >
                  {msg.pending ? '…' : msg.content}
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-100">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-gray-200 p-3 flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask something… (Enter to send, Shift+Enter for new line)"
            rows={1}
            disabled={sending}
            className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent disabled:opacity-50 max-h-32 overflow-y-auto"
            style={{ height: 'auto', minHeight: '38px' }}
            onInput={(e) => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = `${Math.min(el.scrollHeight, 128)}px`
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="shrink-0 bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sending ? '…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}
