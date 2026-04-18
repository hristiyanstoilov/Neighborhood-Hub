import Link from 'next/link'
import type { RecommendedSkill } from '../_lib/chat-queries'

export type Conversation = {
  id: string
  title: string | null
  updatedAt: string
}

type ChatSidebarProps = {
  conversations: Conversation[]
  activeConvId: string | null
  loadingConvs: boolean
  loadingRecommendations: boolean
  recommendationsError: string | null
  recommendations: RecommendedSkill[]
  aiSummary: string | null
  onStartNewConversation: () => void
  onSelectConversation: (id: string) => void
  onRequestDeleteConversation: (conversation: Conversation) => void
}

export function ChatSidebar({
  conversations,
  activeConvId,
  loadingConvs,
  loadingRecommendations,
  recommendationsError,
  recommendations,
  aiSummary,
  onStartNewConversation,
  onSelectConversation,
  onRequestDeleteConversation,
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
                onClick={(e) => { e.stopPropagation(); onRequestDeleteConversation(conv) }}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity text-xs px-1"
                title="Delete"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {aiSummary && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-green-700 mb-1.5">AI insight</p>
          <p className="text-xs text-green-800 leading-relaxed">{aiSummary}</p>
        </div>
      )}

      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Recommended skills</p>
          {loadingRecommendations && <span className="text-[11px] text-gray-400">Loading…</span>}
        </div>

        {recommendationsError ? (
          <p className="text-xs text-red-500 leading-snug">{recommendationsError}</p>
        ) : recommendations.length === 0 && !loadingRecommendations ? (
          <p className="text-xs text-gray-400 leading-snug">
            Start a conversation or add skills to get personalized recommendations.
          </p>
        ) : (
          <div className="space-y-2">
            {recommendations.map((skill) => (
              <Link
                key={skill.id}
                href={`/skills/${skill.id}`}
                className="block rounded-md border border-gray-200 px-2.5 py-2 hover:border-green-300 hover:bg-green-50 transition-colors"
              >
                <p className="text-xs font-medium text-gray-800 line-clamp-2">{skill.title}</p>
                <p className="mt-0.5 text-[11px] text-gray-500 line-clamp-2">{skill.reason}</p>
                <p className="mt-0.5 text-[11px] text-gray-400 line-clamp-2">
                  {skill.categoryLabel ?? 'General'}
                  {skill.locationNeighborhood ? ` · ${skill.locationNeighborhood}${skill.locationCity ? `, ${skill.locationCity}` : ''}` : ''}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}