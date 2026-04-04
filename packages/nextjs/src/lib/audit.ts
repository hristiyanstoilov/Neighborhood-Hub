import { db } from '@/db'
import { auditLog } from '@/db/schema'

interface AuditEntry {
  userId?: string
  userEmail?: string
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'register' | 'verify_email' | 'reset_password'
  entity?: string
  entityId?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
}

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    await db.insert(auditLog).values({
      userId: entry.userId ?? null,
      userEmail: entry.userEmail ?? null,
      action: entry.action,
      entity: entry.entity ?? null,
      entityId: entry.entityId ?? null,
      metadata: entry.metadata ?? null,
      ipAddress: entry.ipAddress ?? null,
    })
  } catch (err) {
    // Audit log failure must never break the main flow
    console.error('[audit]', err)
  }
}
