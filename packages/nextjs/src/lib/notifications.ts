import { inArray, eq } from 'drizzle-orm'
import { db } from '@/db'
import { notifications, users } from '@/db/schema'

type NotificationPayload = {
  userId: string
  type: string
  entityType: string
  entityId: string
}

/**
 * Fire-and-forget notification insert. Skips if the recipient has
 * disabled notifications. Logs failures instead of swallowing them.
 */
export function queueNotification(payload: NotificationPayload): void {
  void (async () => {
    try {
      const recipient = await db.query.users.findFirst({
        where: eq(users.id, payload.userId),
        columns: { notificationsEnabled: true },
      })
      if (recipient?.notificationsEnabled === false) return
      await db.insert(notifications).values(payload)
    } catch (e) {
      console.error('[queueNotification] insert failed', e)
    }
  })()
}

/**
 * Fire-and-forget bulk notification insert. Filters out recipients who
 * have disabled notifications before inserting.
 */
export function queueNotificationBulk(payloads: NotificationPayload[]): void {
  if (payloads.length === 0) return
  void (async () => {
    try {
      const recipientIds = [...new Set(payloads.map((p) => p.userId))]
      const prefs = await db
        .select({ id: users.id, notificationsEnabled: users.notificationsEnabled })
        .from(users)
        .where(inArray(users.id, recipientIds))
      const optedOut = new Set(prefs.filter((u) => !u.notificationsEnabled).map((u) => u.id))
      const toInsert = payloads.filter((p) => !optedOut.has(p.userId))
      if (toInsert.length === 0) return
      await db.insert(notifications).values(toInsert)
    } catch (e) {
      console.error('[queueNotificationBulk] insert failed', e)
    }
  })()
}
