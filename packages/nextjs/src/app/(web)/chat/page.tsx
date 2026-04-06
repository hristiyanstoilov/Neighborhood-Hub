import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { queryUserByRefreshToken } from '@/lib/queries/admin'
import ChatClient from './chat-client'

export const dynamic = 'force-dynamic'

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
      <ChatClient />
    </div>
  )
}
