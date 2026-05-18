import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { aiConversations, aiMessages, auditLog } from '@/db/schema'
import { eq, lt, notExists } from 'drizzle-orm'
import { requireAdmin, getClientIp } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { apiRatelimit } from '@/lib/ratelimit'

// Privacy Policy commitments:
//   AI chat messages  → deleted after 12 months
//   Audit log entries → deleted after 24 months
const AI_MESSAGE_RETENTION_MONTHS  = 12
const AUDIT_LOG_RETENTION_MONTHS   = 24

// POST /api/admin/data-retention — enforce Privacy Policy data retention limits
export const POST = requireAdmin(async (req: NextRequest, { user }) => {
  try {
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const ip = getClientIp(req)
    const now = new Date()

    const aiCutoff = new Date(now)
    aiCutoff.setMonth(aiCutoff.getMonth() - AI_MESSAGE_RETENTION_MONTHS)

    const auditCutoff = new Date(now)
    auditCutoff.setMonth(auditCutoff.getMonth() - AUDIT_LOG_RETENTION_MONTHS)

    const [deletedAiMessages, deletedAuditLogs] = await Promise.all([
      db.delete(aiMessages).where(lt(aiMessages.createdAt, aiCutoff)).returning({ id: aiMessages.id }),
      db.delete(auditLog).where(lt(auditLog.createdAt, auditCutoff)).returning({ id: auditLog.id }),
    ])

    // Remove conversations that have no remaining messages after the deletion above.
    const deletedConversations = await db
      .delete(aiConversations)
      .where(
        notExists(
          db.select({ id: aiMessages.id }).from(aiMessages).where(eq(aiMessages.conversationId, aiConversations.id))
        )
      )
      .returning({ id: aiConversations.id })

    await writeAuditLog({
      userId:    user.sub,
      userEmail: user.email,
      action:    'delete',
      entity:    'data_retention',
      entityId:  'batch',
      metadata: {
        deletedAiMessages:       deletedAiMessages.length,
        deletedAiConversations:  deletedConversations.length,
        deletedAuditLogs:        deletedAuditLogs.length,
        aiMessageCutoffMonths:   AI_MESSAGE_RETENTION_MONTHS,
        auditLogCutoffMonths:    AUDIT_LOG_RETENTION_MONTHS,
      },
      ipAddress: ip ?? undefined,
    })

    console.info(
      `[admin/data-retention] user=${user.sub} deleted ${deletedAiMessages.length} AI messages, ${deletedConversations.length} conversations, ${deletedAuditLogs.length} audit log entries`
    )

    return NextResponse.json({
      data: {
        deletedAiMessages:      deletedAiMessages.length,
        deletedAiConversations: deletedConversations.length,
        deletedAuditLogs:       deletedAuditLogs.length,
      },
    })
  } catch (err) {
    console.error('[POST /api/admin/data-retention]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
