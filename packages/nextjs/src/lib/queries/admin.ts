import { db } from '@/db'
import { users, profiles, auditLog, refreshTokens } from '@/db/schema'
import { eq, desc, isNull, and, gt } from 'drizzle-orm'

/**
 * Fetch all admin users with their profile information.
 * @param limit - Maximum number of users to return (default: 50)
 * @returns Array of users sorted by creation date (newest first)
 */
export async function queryAdminUsers(limit = 50) {
  return db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      emailVerifiedAt: users.emailVerifiedAt,
      failedLoginAttempts: users.failedLoginAttempts,
      lockedUntil: users.lockedUntil,
      deletedAt: users.deletedAt,
      createdAt: users.createdAt,
      name: profiles.name,
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .orderBy(desc(users.createdAt))
    .limit(limit)
}

/**
 * Fetch admin audit log entries to track system actions.
 * @param limit - Maximum number of log entries to return (default: 30)
 * @returns Array of audit log entries sorted by creation date (newest first)
 */
export async function queryAuditLog(limit = 30) {
  return db
    .select({
      id: auditLog.id,
      userId: auditLog.userId,
      userEmail: auditLog.userEmail,
      action: auditLog.action,
      entity: auditLog.entity,
      entityId: auditLog.entityId,
      metadata: auditLog.metadata,
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .orderBy(desc(auditLog.createdAt))
    .limit(limit)
}

/**
 * Fetch user associated with a valid refresh token.
 * Validates that the token is not revoked, not expired, and user is not deleted.
 * @param token - The refresh token to validate
 * @returns User object with id, role, and email, or null if token is invalid
 */
export async function queryUserByRefreshToken(token: string) {
  const now = new Date()
  const [row] = await db
    .select({ id: users.id, role: users.role, email: users.email })
    .from(refreshTokens)
    .innerJoin(users, eq(users.id, refreshTokens.userId))
    .where(
      and(
        eq(refreshTokens.token, token),
        eq(refreshTokens.isRevoked, false),
        gt(refreshTokens.expiresAt, now),
        isNull(users.deletedAt)
      )
    )
    .limit(1)
  return row ?? null
}
