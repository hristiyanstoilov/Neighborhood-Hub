import { db } from '@/db'
import { pushTokens } from '@/db/schema'
import { eq } from 'drizzle-orm'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

type PushMessage = {
  to: string
  title: string
  body: string
  data?: Record<string, unknown>
  sound?: 'default' | null
  badge?: number
}

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  let tokens: { token: string }[]
  try {
    tokens = await db
      .select({ token: pushTokens.token })
      .from(pushTokens)
      .where(eq(pushTokens.userId, userId))
  } catch {
    return
  }

  if (tokens.length === 0) return

  const messages: PushMessage[] = tokens.map(({ token }) => ({
    to: token,
    title,
    body,
    sound: 'default',
    data,
  }))

  try {
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    })
  } catch (err) {
    console.error('[sendPushNotification] fetch failed', err)
  }
}
