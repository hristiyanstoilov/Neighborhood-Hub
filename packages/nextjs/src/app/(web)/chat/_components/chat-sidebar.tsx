type Conversation = {
  id: string
  title: string | null
  updatedAt: string
}

type ChatSidebarProps = {
  conversations: Conversation[]
  activeConvId: string | null
  loadingConvs: boolean
  onStartNewConversation: () => void
  onSelectConversation: (id: string) => void
  onDeleteConversation: (id: string) => void
}

export function ChatSidebar({
  conversations,
  activeConvId,
  loadingConvs,
  onStartNewConversation,
  onSelectConversation,
  onDeleteConversation,
}: ChatSidebarProps) {
  return (
    <aside className="w-56 shrink-0 flex flex-col gap-1">
      <button
        onClick={onStartNewConversation}
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
              onClick={() => onSelectConversation(conv.id)}
            >
              <span className="flex-1 text-xs line-clamp-2 leading-snug">
                {conv.title ?? 'Untitled'}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteConversation(conv.id) }}
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
  )
}