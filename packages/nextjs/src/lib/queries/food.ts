import { db } from '@/db'
import { foodShares, foodReservations, profiles, locations } from '@/db/schema'
import { and, count, desc, eq, gte, isNull, sql, SQL } from 'drizzle-orm'

export const foodShareSelect = {
  id: foodShares.id,
  title: foodShares.title,
  description: foodShares.description,
  quantity: foodShares.quantity,
  locationId: foodShares.locationId,
  locationCity: locations.city,
  locationNeighborhood: locations.neighborhood,
  availableUntil: foodShares.availableUntil,
  pickupInstructions: foodShares.pickupInstructions,
  imageUrl: foodShares.imageUrl,
  status: foodShares.status,
  createdAt: foodShares.createdAt,
  updatedAt: foodShares.updatedAt,
  ownerId: foodShares.ownerId,
  ownerName: profiles.name,
  activeReservations: sql<number>`(
    SELECT count(*)::int FROM food_reservations
    WHERE food_share_id = ${foodShares.id} AND status IN ('reserved', 'picked_up')
  )`,
  remainingQuantity: sql<number>`GREATEST(
    ${foodShares.quantity} - (
      SELECT count(*)::int FROM food_reservations
      WHERE food_share_id = ${foodShares.id} AND status IN ('reserved', 'picked_up')
    ),
    0
  )`,
} as const

export type FoodFilterOpts = {
  status?: string
  ownerId?: string
}

export function buildFoodShareConditions(opts: FoodFilterOpts): SQL[] {
  const conditions: SQL[] = [isNull(foodShares.deletedAt)]
  if (opts.status) conditions.push(eq(foodShares.status, opts.status))
  if (opts.ownerId) conditions.push(eq(foodShares.ownerId, opts.ownerId))
  return conditions
}

export async function queryFoodShares(opts: FoodFilterOpts & { limit?: number; page?: number }) {
  const { limit = 20, page = 1, ...filterOpts } = opts
  const conditions = buildFoodShareConditions(filterOpts)

  return db
    .select(foodShareSelect)
    .from(foodShares)
    .leftJoin(profiles, eq(profiles.userId, foodShares.ownerId))
    .leftJoin(locations, eq(locations.id, foodShares.locationId))
    .where(and(...conditions))
    .limit(limit)
    .offset((page - 1) * limit)
    .orderBy(desc(foodShares.createdAt))
}

export async function queryFoodSharesPage(opts: FoodFilterOpts & { limit?: number; page?: number }) {
  const { limit = 20, page = 1, ...filterOpts } = opts
  const conditions = buildFoodShareConditions(filterOpts)

  const [rows, [{ total }]] = await Promise.all([
    queryFoodShares({ ...filterOpts, limit, page }),
    db.select({ total: count() }).from(foodShares).where(and(...conditions)),
  ])

  return { foodShares: rows, total }
}

export async function queryFoodShareById(id: string) {
  const [row] = await db
    .select({
      ...foodShareSelect,
      reservationCount: sql<number>`(
        SELECT count(*)::int FROM food_reservations
        WHERE food_share_id = ${foodShares.id} AND status IN ('pending', 'reserved', 'picked_up')
      )`,
    })
    .from(foodShares)
    .leftJoin(profiles, eq(profiles.userId, foodShares.ownerId))
    .leftJoin(locations, eq(locations.id, foodShares.locationId))
    .where(and(eq(foodShares.id, id), isNull(foodShares.deletedAt)))
    .limit(1)

  return row ?? null
}

export async function queryFoodReservationUsage(foodShareId: string) {
  const reservations = await db
    .select({ status: foodReservations.status })
    .from(foodReservations)
    .where(eq(foodReservations.foodShareId, foodShareId))

  const activeCount = reservations.filter((reservation) => reservation.status === 'reserved' || reservation.status === 'picked_up').length
  const pickedUpCount = reservations.filter((reservation) => reservation.status === 'picked_up').length

  return { activeCount, pickedUpCount }
}

export async function queryUserFoodReservation(foodShareId: string, userId: string) {
  const [row] = await db
    .select({
      id: foodReservations.id,
      status: foodReservations.status,
      pickupAt: foodReservations.pickupAt,
      notes: foodReservations.notes,
      cancellationReason: foodReservations.cancellationReason,
    })
    .from(foodReservations)
    .where(and(eq(foodReservations.foodShareId, foodShareId), eq(foodReservations.requesterId, userId)))
    .limit(1)

  return row ?? null
}

export async function queryFoodReservations(foodShareId: string) {
  return db
    .select({
      id: foodReservations.id,
      requesterId: foodReservations.requesterId,
      requesterName: profiles.name,
      ownerId: foodReservations.ownerId,
      pickupAt: foodReservations.pickupAt,
      status: foodReservations.status,
      notes: foodReservations.notes,
      cancellationReason: foodReservations.cancellationReason,
      pickedUpAt: foodReservations.pickedUpAt,
      createdAt: foodReservations.createdAt,
    })
    .from(foodReservations)
    .leftJoin(profiles, eq(profiles.userId, foodReservations.requesterId))
    .where(eq(foodReservations.foodShareId, foodShareId))
    .orderBy(desc(foodReservations.createdAt))
}

export async function queryFoodReservationsForUser(userId: string, role: 'requester' | 'owner') {
  const filterCol = role === 'requester' ? foodReservations.requesterId : foodReservations.ownerId

  return db
    .select({
      id: foodReservations.id,
      foodShareId: foodReservations.foodShareId,
      foodShareTitle: foodShares.title,
      foodShareImageUrl: foodShares.imageUrl,
      requesterId: foodReservations.requesterId,
      ownerId: foodReservations.ownerId,
      pickupAt: foodReservations.pickupAt,
      status: foodReservations.status,
      notes: foodReservations.notes,
      cancellationReason: foodReservations.cancellationReason,
      pickedUpAt: foodReservations.pickedUpAt,
      createdAt: foodReservations.createdAt,
      requesterName: profiles.name,
    })
    .from(foodReservations)
    .leftJoin(foodShares, eq(foodShares.id, foodReservations.foodShareId))
    .leftJoin(profiles, eq(profiles.userId, foodReservations.requesterId))
    .where(eq(filterCol, userId))
    .orderBy(desc(foodReservations.createdAt))
    .limit(50)
}