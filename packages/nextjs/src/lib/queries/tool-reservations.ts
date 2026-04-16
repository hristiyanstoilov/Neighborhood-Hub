import { db } from '@/db'
import { toolReservations, tools, profiles } from '@/db/schema'
import { eq, or, and, desc } from 'drizzle-orm'

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

export async function queryToolReservationsForUser(userId: string, role: 'borrower' | 'owner') {
  const filterCol = role === 'borrower' ? toolReservations.borrowerId : toolReservations.ownerId

  return db
    .select({
      id:                 toolReservations.id,
      toolId:             toolReservations.toolId,
      toolTitle:          tools.title,
      toolImageUrl:       tools.imageUrl,
      borrowerId:         toolReservations.borrowerId,
      ownerId:            toolReservations.ownerId,
      startDate:          toolReservations.startDate,
      endDate:            toolReservations.endDate,
      status:             toolReservations.status,
      notes:              toolReservations.notes,
      cancellationReason: toolReservations.cancellationReason,
    })
    .from(toolReservations)
    .leftJoin(tools, eq(tools.id, toolReservations.toolId))
    .where(eq(filterCol, userId))
    .orderBy(desc(toolReservations.createdAt))
    .limit(50)
}
