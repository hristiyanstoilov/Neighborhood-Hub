import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { users, profiles, locations, categories, skills, tools, skillRequests } from '@/db/schema'

// Fixed UUIDs so test files can reference seed data without querying
export const seed = {
  locationId:      '10000000-0000-0000-0000-000000000001',
  categoryId:      '10000000-0000-0000-0000-000000000002',
  ownerUserId:     '10000000-0000-0000-0000-000000000010',
  requesterUserId: '10000000-0000-0000-0000-000000000011',
  skillId:         '10000000-0000-0000-0000-000000000020',
  deletedSkillId:  '10000000-0000-0000-0000-000000000099',
  toolId:          '10000000-0000-0000-0000-000000000021',
  skillRequestId:  '10000000-0000-0000-0000-000000000030',
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
