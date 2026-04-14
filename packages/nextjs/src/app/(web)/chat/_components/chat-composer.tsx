import { RefObject } from 'react'

type ChatComposerProps = {
  inputRef: RefObject<HTMLTextAreaElement | null>
  input: string
  sending: boolean
  onInputChange: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onSend: () => void
}

export function ChatComposer({
  inputRef,
  input,
  sending,
  onInputChange,
  onKeyDown,
  onSend,
}: ChatComposerProps) {
  return (
    <div className="border-t border-gray-200 p-3 flex gap-2 items-end">
      <textarea
        ref={inputRef}
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Ask something… (Enter to send, Shift+Enter for new line)"
        aria-label="Message"
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
        onClick={onSend}
        disabled={!input.trim() || sending}
        aria-label={sending ? 'Sending…' : 'Send message'}
        aria-busy={sending}
        className="shrink-0 bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {sending ? '…' : 'Send'}
      </button>
    </div>
  )
}