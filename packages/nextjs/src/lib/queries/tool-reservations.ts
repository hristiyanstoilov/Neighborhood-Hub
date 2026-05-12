import { db } from '@/db'
import { toolReservations, tools, profiles } from '@/db/schema'
import { eq, and, desc, isNull } from 'drizzle-orm'

export const toolReservationSelect = {
  id:                 toolReservations.id,
  toolId:             toolReservations.toolId,
  toolTitle:          tools.title,
  toolImageUrl:       tools.imageUrl,
  borrowerId:         toolReservations.borrowerId,
  borrowerName:       profiles.name,
  ownerId:            toolReservations.ownerId,
  startDate:          toolReservations.startDate,
  endDate:            toolReservations.endDate,
  status:             toolReservations.status,
  notes:              toolReservations.notes,
  cancellationReason: toolReservations.cancellationReason,
} as const

export async function queryToolReservationsForUser(userId: string, role: 'borrower' | 'owner', limit = 20, offset = 0) {
  const filterCol = role === 'borrower' ? toolReservations.borrowerId : toolReservations.ownerId

  return db
    .select(toolReservationSelect)
    .from(toolReservations)
    .leftJoin(tools, eq(tools.id, toolReservations.toolId))
    .leftJoin(profiles, eq(profiles.userId, toolReservations.borrowerId))
    .where(and(eq(filterCol, userId), isNull(tools.deletedAt)))
    .orderBy(desc(toolReservations.createdAt))
    .limit(limit)
    .offset(offset)
}
