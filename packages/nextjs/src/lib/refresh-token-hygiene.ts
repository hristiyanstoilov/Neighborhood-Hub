import { and, eq, lt, or } from 'drizzle-orm'
import { db } from '@/db'
import { refreshTokens } from '@/db/schema'

const REVOKED_TOKEN_RETENTION_DAYS = 30

export async function cleanupRefreshTokensForUser(userId: string): Promise<void> {
  const now = new Date()
  const revokedCutoff = new Date(now.getTime() - REVOKED_TOKEN_RETENTION_DAYS * 24 * 60 * 60 * 1000)

  await db
    .delete(refreshTokens)
    .where(
      and(
        eq(refreshTokens.userId, userId),
        or(
          lt(refreshTokens.expiresAt, now),
          and(eq(refreshTokens.isRevoked, true), lt(refreshTokens.createdAt, revokedCutoff))
        )
      )
    )
}
