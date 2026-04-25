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

function parseValidDate(raw: string | null): Date | null {
  if (!raw) return null
  const d = new Date(raw)
  return isNaN(d.getTime()) ? null : d
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

  // Cursor is an ISO timestamp string — validated before use in queries
  const rawCursor = req.headers.get('last-event-id') ?? req.nextUrl.searchParams.get('lastId') ?? null
  const encoder = new TextEncoder()

  // lastSeenAt is the timestamp of the most recent notification sent to this client
  let lastSeenAt: Date | null = parseValidDate(rawCursor)

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
              lastSeenAt
                ? and(eq(notifications.userId, userId), gt(notifications.createdAt, lastSeenAt))
                : eq(notifications.userId, userId)
            )
            .orderBy(desc(notifications.createdAt))
            .limit(20)

          if (rows.length > 0) {
            // Update cursor to the most recent createdAt
            lastSeenAt = rows[0].createdAt
            for (const row of rows.reverse()) {
              // Emit ISO timestamp as event ID so the client can resume from it
              send(`id: ${row.createdAt.toISOString()}\n${sseEvent('notification', row)}`)
            }
          }
        } catch {
          // DB error — keep stream open, retry on next poll
        }

        if (!closed && Date.now() - startedAt < MAX_DURATION_MS) {
          pollTimer = setTimeout(() => void poll(), POLL_INTERVAL_MS)
        } else {
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
