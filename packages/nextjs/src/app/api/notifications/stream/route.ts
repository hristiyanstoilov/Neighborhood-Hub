import { NextRequest } from 'next/server'
import { db } from '@/db'
import { notifications } from '@/db/schema'
import { eq, and, gt, desc } from 'drizzle-orm'
import { verifyAccessToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const POLL_INTERVAL_MS = 10_000
const HEARTBEAT_INTERVAL_MS = 25_000
const MAX_DURATION_MS = 55_000 // stay under Vercel's 60s function limit

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 })
  }

  let userId: string
  try {
    const payload = verifyAccessToken(authHeader.slice(7))
    userId = payload.sub
  } catch {
    return new Response('Invalid token', { status: 401 })
  }

  const lastEventId = req.headers.get('last-event-id') ?? req.nextUrl.searchParams.get('lastId') ?? null

  const encoder = new TextEncoder()
  let lastId = lastEventId

  const stream = new ReadableStream({
    async start(controller) {
      const startedAt = Date.now()

      function send(chunk: string) {
        try {
          controller.enqueue(encoder.encode(chunk))
        } catch {
          // client disconnected
        }
      }

      // Initial heartbeat so client knows connection is live
      send(sseEvent('connected', { ok: true }))

      let pollTimer: ReturnType<typeof setTimeout> | null = null
      let heartbeatTimer: ReturnType<typeof setTimeout> | null = null
      let closed = false

      function close() {
        if (closed) return
        closed = true
        if (pollTimer) clearTimeout(pollTimer)
        if (heartbeatTimer) clearTimeout(heartbeatTimer)
        try { controller.close() } catch { /* already closed */ }
      }

      async function poll() {
        if (closed) return
        try {
          const rows = await db
            .select({
              id: notifications.id,
              type: notifications.type,
              entityType: notifications.entityType,
              entityId: notifications.entityId,
              isRead: notifications.isRead,
              createdAt: notifications.createdAt,
            })
            .from(notifications)
            .where(
              lastId
                ? and(eq(notifications.userId, userId), gt(notifications.id, lastId))
                : eq(notifications.userId, userId)
            )
            .orderBy(desc(notifications.createdAt))
            .limit(20)

          if (rows.length > 0) {
            lastId = rows[0].id
            for (const row of rows.reverse()) {
              send(`id: ${row.id}\n${sseEvent('notification', row)}`)
            }
          }
        } catch {
          // DB error — keep stream open, retry on next poll
        }

        if (!closed && Date.now() - startedAt < MAX_DURATION_MS) {
          pollTimer = setTimeout(() => void poll(), POLL_INTERVAL_MS)
        } else {
          // Ask client to reconnect cleanly
          send(sseEvent('reconnect', { reason: 'timeout' }))
          close()
        }
      }

      function heartbeat() {
        if (closed) return
        send(`: heartbeat\n\n`)
        if (Date.now() - startedAt < MAX_DURATION_MS) {
          heartbeatTimer = setTimeout(heartbeat, HEARTBEAT_INTERVAL_MS)
        }
      }

      void poll()
      heartbeatTimer = setTimeout(heartbeat, HEARTBEAT_INTERVAL_MS)

      // Signal cleanup when client aborts
      req.signal.addEventListener('abort', close)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
