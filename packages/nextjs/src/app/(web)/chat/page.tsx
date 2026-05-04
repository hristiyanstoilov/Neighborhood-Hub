import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { queryUserByRefreshToken } from '@/lib/queries/admin'
import ChatClient from './chat-client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'AI Assistant',
  description: 'Ask the neighborhood AI assistant anything about the community.',
}

export default async function ChatPage() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refresh_token')?.value
  const user = refreshToken ? await queryUserByRefreshToken(refreshToken) : null

  if (!user) {
    redirect('/login?next=/chat')
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ask anything about Neighborhood Hub — skills, requests, or how to get started.
        </p>
      </div>

      {/* EU AI Act Art. 50 — mandatory AI disclosure */}
      <div className="mb-4 flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
        <span>
          You are chatting with an <strong>AI assistant</strong> powered by Claude (Anthropic). Responses are generated automatically and are not professional advice.
        </span>
      </div>

      <ChatClient />
    </div>
  )
}
