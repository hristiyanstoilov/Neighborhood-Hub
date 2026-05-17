import { db } from '@/db'
import { userBlocks } from '@/db/schema'
import { and, eq, or } from 'drizzle-orm'

export async function isBlocked(userA: string, userB: string): Promise<boolean> {
  const [row] = await db
    .select({ id: userBlocks.id })
    .from(userBlocks)
    .where(or(
      and(eq(userBlocks.blockerId, userA), eq(userBlocks.blockedId, userB)),
      and(eq(userBlocks.blockerId, userB), eq(userBlocks.blockedId, userA)),
    ))
    .limit(1)
  return !!row
}
