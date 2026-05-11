import { db } from '@/db'
import { eq } from 'drizzle-orm'

/**
 * Validates that a foreign key reference exists in the database.
 * Returns an error object if the FK doesn't exist, or null if it's valid or not provided.
 */
export async function validateForeignKey(
  table: any,
  id: string | null | undefined,
  errorCode: string,
): Promise<{ error: string; status: 400 | 500 } | null> {
  if (!id) return null

  try {
    const rows = await db
      .select({ id: table.id })
      .from(table)
      .where(eq(table.id, id))
      .limit(1)

    if (rows.length === 0) {
      return { error: errorCode, status: 400 }
    }

    return null
  } catch (err) {
    console.error(`[validateForeignKey] Error checking ${errorCode}:`, err)
    return { error: 'INTERNAL_ERROR', status: 500 }
  }
}
