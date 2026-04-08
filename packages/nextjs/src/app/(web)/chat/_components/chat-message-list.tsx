import { MutableRefObject } from 'react'

type Message = {
  id?: string
  role: 'user' | 'assistant'
  content: string
  pending?: boolean
}

type Suggestion = {
  icon: string
  text: string
}

type ChatMessageListProps = {
  loadingMsgs: boolean
  messages: Message[]
  bottomRef: MutableRefObject<HTMLDivElement | null>
  suggestions: Suggestion[]
  onSuggestionClick: (text: string) => void
}

export function ChatMessageList({
  loadingMsgs,
  messages,
  bottomRef,
  suggestions,
  onSuggestionClick,
}: ChatMessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
      {loadingMsgs ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-400">Loading…</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-3">
          <div className="text-4xl">💬</div>
          <p className="text-gray-600 text-sm font-medium">How can I help you today?</p>
          <p className="text-gray-400 text-xs max-w-xs -mt-1">
            Ask me anything about Neighborhood Hub — skills, requests, your profile, or how things work.
          </p>
          <div className="grid grid-cols-2 gap-2 w-full max-w-sm mt-2">
            {suggestions.map((s) => (
              <button
                key={s.text}
                onClick={() => onSuggestionClick(s.text)}
                className="flex items-start gap-2 text-xs text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 hover:border-green-400 hover:bg-green-50 transition-colors text-left"
              >
                <span className="text-base leading-none mt-0.5">{s.icon}</span>
                <span>{s.text}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        messages.map((msg, index) => (
          <div
            key={msg.id ?? index}
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
  )
}