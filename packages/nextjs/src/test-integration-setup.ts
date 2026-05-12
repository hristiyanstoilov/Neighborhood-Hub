import { sql } from 'drizzle-orm'
import { db } from '@/db'
import {
  users,
  profiles,
  locations,
  categories,
  skills,
  tools,
  toolReservations,
  skillRequests,
  foodShares,
  foodReservations,
  communityDrives,
  events,
} from '@/db/schema'
import { beforeAll } from 'vitest'

// Fixed UUIDs so test files can reference seed data without querying
export const seed = {
  locationId:      '10000000-0000-0000-0000-000000000001',
  categoryId:      '10000000-0000-0000-0000-000000000002',
  ownerUserId:     '10000000-0000-0000-0000-000000000010',
  requesterUserId: '10000000-0000-0000-0000-000000000011',
  skillId:         '10000000-0000-0000-0000-000000000020',
  deletedSkillId:  '10000000-0000-0000-0000-000000000099',
  toolId:          '10000000-0000-0000-0000-000000000021',
  toolReservationId: '10000000-0000-0000-0000-000000000022',
  skillRequestId:  '10000000-0000-0000-0000-000000000030',
  foodShareId:       '10000000-0000-0000-0000-000000000040',
  foodReservationId: '10000000-0000-0000-0000-000000000041',
  driveId:           '10000000-0000-0000-0000-000000000050',
  eventId:           '10000000-0000-0000-0000-000000000060',
}

beforeAll(async () => {
  // Wipe all tables via root FK anchors; CASCADE covers all dependent tables
  await db.execute(sql`TRUNCATE users, locations, categories RESTART IDENTITY CASCADE`)

  await db.insert(locations).values({
    id: seed.locationId,
    city: 'Sofia',
    neighborhood: 'Test Neighborhood',
    lat: '42.6769',
    lng: '23.3315',
    type: 'neighborhood',
  })

  await db.insert(categories).values({
    id: seed.categoryId,
    slug: 'test-integration-cat',
    label: 'Test Category',
    icon: 'wrench',
  })

  await db.insert(users).values([
    { id: seed.ownerUserId,     email: 'owner@test.example',     passwordHash: 'x', role: 'user' },
    { id: seed.requesterUserId, email: 'requester@test.example', passwordHash: 'x', role: 'user' },
  ])

  await db.insert(profiles).values([
    { userId: seed.ownerUserId,     name: 'Owner User' },
    { userId: seed.requesterUserId, name: 'Requester User' },
  ])

  await db.insert(skills).values([
    {
      id: seed.skillId,
      title: 'Yoga Classes',
      description: 'Beginner yoga for all levels',
      status: 'available',
      availableHours: 5,
      ownerId: seed.ownerUserId,
      categoryId: seed.categoryId,
      locationId: seed.locationId,
    },
    {
      id: seed.deletedSkillId,
      title: 'Deleted Skill',
      description: 'Should never appear in query results',
      status: 'available',
      availableHours: 1,
      ownerId: seed.ownerUserId,
      deletedAt: new Date(),
    },
  ])

  await db.insert(tools).values({
    id: seed.toolId,
    title: 'Power Drill',
    description: 'Cordless drill, 18V',
    status: 'available',
    condition: 'good',
    ownerId: seed.ownerUserId,
    categoryId: seed.categoryId,
    locationId: seed.locationId,
  })

  await db.insert(toolReservations).values({
    id: seed.toolReservationId,
    toolId: seed.toolId,
    borrowerId: seed.requesterUserId,
    ownerId: seed.ownerUserId,
    startDate: new Date(),
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    status: 'pending',
  })

  await db.insert(foodShares).values({
    id: seed.foodShareId,
    ownerId: seed.ownerUserId,
    title: 'Fresh Tomatoes',
    description: 'Garden tomatoes',
    quantity: 5,
    locationId: seed.locationId,
    status: 'available',
  })

  const pickupAt = new Date(Date.now() + 26 * 3600 * 1000)
  await db.insert(foodReservations).values({
    id: seed.foodReservationId,
    foodShareId: seed.foodShareId,
    requesterId: seed.requesterUserId,
    ownerId: seed.ownerUserId,
    pickupAt,
    status: 'pending',
  })

  await db.insert(communityDrives).values({
    id: seed.driveId,
    organizerId: seed.ownerUserId,
    title: 'Winter Clothes Drive',
    description: 'Collecting warm clothes for families in need',
    driveType: 'items',
    status: 'open',
  })

  await db.insert(events).values({
    id: seed.eventId,
    title: 'Community Cleanup',
    organizerId: seed.ownerUserId,
    locationId: seed.locationId,
    startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: 'published',
  })

  const start = new Date(Date.now() + 24 * 3600 * 1000)
  const end   = new Date(Date.now() + 25 * 3600 * 1000)

  await db.insert(skillRequests).values({
    id: seed.skillRequestId,
    skillId: seed.skillId,
    userFromId: seed.requesterUserId,
    userToId:   seed.ownerUserId,
    status: 'pending',
    scheduledStart: start,
    scheduledEnd:   end,
    meetingType: 'in_person',
  })
})
