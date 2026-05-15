import { describe, expect, it } from 'vitest'
import {
  createSkillSchema,
  listSkillsSchema,
  skillStatusSchema,
  updateSkillSchema,
  uuidSchema,
} from './skill'
import {
  createToolSchema,
  listToolsSchema,
  updateToolSchema,
} from './tool'
import {
  createFoodReservationSchema,
  createFoodShareSchema,
  listFoodReservationsSchema,
  listFoodSharesSchema,
  updateFoodReservationSchema,
  updateFoodShareSchema,
} from './food'
import {
  createSkillRequestSchema,
  patchSkillRequestSchema,
  listSkillRequestsSchema,
} from './skill-request'
import { createRatingSchema } from './rating'
import {
  createDriveSchema,
  listDrivesSchema,
  createPledgeSchema,
} from './drive'
import { createEventSchema, listEventsSchema } from './event'
import { createToolReservationSchema, patchToolReservationSchema } from './tool-reservation'

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000'

const makeString = (length: number) => 'a'.repeat(length)
const makeFutureIso = () => new Date(Date.now() + 60 * 60 * 1000).toISOString()
const makeFarFutureIso = () => new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()

function expectIssuePath(
  result: { success: boolean; error?: { issues: Array<{ path: PropertyKey[] }> } },
  fieldName: string
) {
  expect(result.success).toBe(false)
  if (result.success) return
  expect(result.error?.issues[0]?.path).toEqual([fieldName])
}

describe('uuidSchema', () => {
  it('accepts a valid UUID', () => {
    expect(uuidSchema.safeParse(VALID_UUID).success).toBe(true)
  })

  it('rejects a missing value', () => {
    expect(uuidSchema.safeParse(undefined).success).toBe(false)
  })

  it('rejects an invalid UUID string', () => {
    expect(uuidSchema.safeParse('not-a-uuid').success).toBe(false)
  })
})

describe('createSkillSchema', () => {
  it('accepts a valid full payload', () => {
    const result = createSkillSchema.safeParse({
      title: 'Gardening',
      description: 'I can help with garden maintenance and planting.',
      categoryId: VALID_UUID,
      availableHours: 8,
      imageUrl: 'https://example.com/skill.png',
      locationId: VALID_UUID,
    })

    expect(result.success).toBe(true)
  })

  it('rejects a missing required field', () => {
    const result = createSkillSchema.safeParse({
      description: 'I can help with garden maintenance and planting.',
      categoryId: VALID_UUID,
      availableHours: 8,
      imageUrl: 'https://example.com/skill.png',
      locationId: VALID_UUID,
    })

    expectIssuePath(result, 'title')
  })

  it('rejects a title that is too short', () => {
    const result = createSkillSchema.safeParse({
      title: 'ab',
      description: 'I can help with garden maintenance and planting.',
      categoryId: VALID_UUID,
      availableHours: 8,
      imageUrl: 'https://example.com/skill.png',
      locationId: VALID_UUID,
    })

    expectIssuePath(result, 'title')
  })

  it('accepts the minimum valid title length', () => {
    const result = createSkillSchema.safeParse({
      title: 'abc',
      description: 'I can help with garden maintenance and planting.',
      categoryId: VALID_UUID,
      availableHours: 0,
      imageUrl: 'https://example.com/skill.png',
      locationId: VALID_UUID,
    })

    expect(result.success).toBe(true)
  })
})

describe('updateSkillSchema', () => {
  it('accepts a valid full payload', () => {
    const result = updateSkillSchema.safeParse({
      title: 'Gardening',
      description: 'I can help with garden maintenance and planting.',
      categoryId: VALID_UUID,
      availableHours: 8,
      imageUrl: null,
      locationId: VALID_UUID,
      status: 'available',
    })

    expect(result.success).toBe(true)
  })

  it('rejects a title that is too short', () => {
    const result = updateSkillSchema.safeParse({
      title: 'ab',
    })

    expectIssuePath(result, 'title')
  })

  it('rejects an invalid status value', () => {
    const result = updateSkillSchema.safeParse({
      status: 'unknown',
    })

    expectIssuePath(result, 'status')
  })

  it('accepts the minimum valid title length', () => {
    const result = updateSkillSchema.safeParse({
      title: 'abc',
    })

    expect(result.success).toBe(true)
  })
})

describe('skillStatusSchema', () => {
  it('accepts a valid status payload', () => {
    expect(skillStatusSchema.safeParse({ status: 'available' }).success).toBe(true)
  })

  it('rejects a missing required field', () => {
    const result = skillStatusSchema.safeParse({})

    expectIssuePath(result, 'status')
  })

  it('rejects an invalid status value', () => {
    const result = skillStatusSchema.safeParse({ status: 'archived' })

    expectIssuePath(result, 'status')
  })

  it('accepts another valid enum value', () => {
    expect(skillStatusSchema.safeParse({ status: 'retired' }).success).toBe(true)
  })
})

describe('listSkillsSchema', () => {
  it('accepts a valid full payload', () => {
    const result = listSkillsSchema.safeParse({
      categoryId: VALID_UUID,
      locationId: VALID_UUID,
      status: 'busy',
      search: makeString(100),
      page: 1,
      limit: 50,
    })

    expect(result.success).toBe(true)
  })

  it('accepts an empty payload because all fields are optional or defaulted', () => {
    expect(listSkillsSchema.safeParse({}).success).toBe(true)
  })

  it('rejects an invalid status value', () => {
    const result = listSkillsSchema.safeParse({ status: 'unknown' })

    expectIssuePath(result, 'status')
  })

  it('rejects a page value below the minimum', () => {
    const result = listSkillsSchema.safeParse({ page: 0 })

    expectIssuePath(result, 'page')
  })

  it('accepts a search term at the maximum length', () => {
    const result = listSkillsSchema.safeParse({ search: makeString(100) })

    expect(result.success).toBe(true)
  })
})

describe('createToolSchema', () => {
  it('accepts a valid full payload', () => {
    const result = createToolSchema.safeParse({
      title: 'Hammer',
      description: 'A sturdy hammer for everyday repairs.',
      categoryId: VALID_UUID,
      locationId: VALID_UUID,
      condition: 'good',
      imageUrl: 'https://example.com/tool.png',
    })

    expect(result.success).toBe(true)
  })

  it('rejects a missing required field', () => {
    const result = createToolSchema.safeParse({
      description: 'A sturdy hammer for everyday repairs.',
      categoryId: VALID_UUID,
      locationId: VALID_UUID,
      condition: 'good',
      imageUrl: 'https://example.com/tool.png',
    })

    expectIssuePath(result, 'title')
  })

  it('rejects a title that is too short', () => {
    const result = createToolSchema.safeParse({
      title: 'ab',
      description: 'A sturdy hammer for everyday repairs.',
      categoryId: VALID_UUID,
      locationId: VALID_UUID,
      condition: 'good',
      imageUrl: 'https://example.com/tool.png',
    })

    expectIssuePath(result, 'title')
  })

  it('rejects an invalid condition value', () => {
    const result = createToolSchema.safeParse({
      title: 'Hammer',
      condition: 'broken',
    })

    expectIssuePath(result, 'condition')
  })

  it('accepts the minimum valid title length', () => {
    const result = createToolSchema.safeParse({
      title: 'abc',
    })

    expect(result.success).toBe(true)
  })
})

describe('updateToolSchema', () => {
  it('accepts a valid full payload', () => {
    const result = updateToolSchema.safeParse({
      title: 'Hammer',
      description: 'A sturdy hammer for everyday repairs.',
      categoryId: VALID_UUID,
      locationId: VALID_UUID,
      condition: 'fair',
      imageUrl: null,
      status: 'available',
    })

    expect(result.success).toBe(true)
  })

  it('rejects a title that is too short', () => {
    const result = updateToolSchema.safeParse({
      title: 'ab',
    })

    expectIssuePath(result, 'title')
  })

  it('rejects an invalid status value', () => {
    const result = updateToolSchema.safeParse({
      status: 'broken',
    })

    expectIssuePath(result, 'status')
  })

  it('accepts the minimum valid title length', () => {
    const result = updateToolSchema.safeParse({
      title: 'abc',
    })

    expect(result.success).toBe(true)
  })
})

describe('listToolsSchema', () => {
  it('accepts a valid full payload', () => {
    const result = listToolsSchema.safeParse({
      categoryId: VALID_UUID,
      locationId: VALID_UUID,
      status: 'in_use',
      search: makeString(100),
      page: 1,
      limit: 50,
    })

    expect(result.success).toBe(true)
  })

  it('accepts an empty payload because all fields are optional or defaulted', () => {
    expect(listToolsSchema.safeParse({}).success).toBe(true)
  })

  it('rejects an invalid status value', () => {
    const result = listToolsSchema.safeParse({ status: 'broken' })

    expectIssuePath(result, 'status')
  })

  it('rejects a limit value below the minimum', () => {
    const result = listToolsSchema.safeParse({ limit: 0 })

    expectIssuePath(result, 'limit')
  })

  it('accepts a search term at the maximum length', () => {
    const result = listToolsSchema.safeParse({ search: makeString(100) })

    expect(result.success).toBe(true)
  })
})

describe('createFoodShareSchema', () => {
  it('accepts a valid full payload', () => {
    const result = createFoodShareSchema.safeParse({
      title: 'Soup',
      description: 'Homemade vegetable soup in a sealed container.',
      quantity: 2,
      locationId: VALID_UUID,
      availableUntil: makeFutureIso(),
      pickupInstructions: 'Please ring the bell once.',
      imageUrl: 'https://example.com/food.png',
    })

    expect(result.success).toBe(true)
  })

  it('rejects a missing required field', () => {
    const result = createFoodShareSchema.safeParse({
      description: 'Homemade vegetable soup in a sealed container.',
      quantity: 2,
      locationId: VALID_UUID,
      availableUntil: makeFutureIso(),
      pickupInstructions: 'Please ring the bell once.',
      imageUrl: 'https://example.com/food.png',
    })

    expectIssuePath(result, 'title')
  })

  it('rejects a title that is too short', () => {
    const result = createFoodShareSchema.safeParse({
      title: 'ab',
      description: 'Homemade vegetable soup in a sealed container.',
      quantity: 2,
      locationId: VALID_UUID,
      availableUntil: makeFutureIso(),
      pickupInstructions: 'Please ring the bell once.',
      imageUrl: 'https://example.com/food.png',
    })

    expectIssuePath(result, 'title')
  })

  it('accepts the minimum valid quantity', () => {
    const result = createFoodShareSchema.safeParse({
      title: 'Soup',
      quantity: 1,
      availableUntil: makeFutureIso(),
    })

    expect(result.success).toBe(true)
  })
})

describe('updateFoodShareSchema', () => {
  it('accepts a valid full payload', () => {
    const result = updateFoodShareSchema.safeParse({
      title: 'Soup',
      description: 'Homemade vegetable soup in a sealed container.',
      quantity: 2,
      locationId: VALID_UUID,
      availableUntil: makeFutureIso(),
      pickupInstructions: 'Please ring the bell once.',
      imageUrl: null,
      status: 'available',
    })

    expect(result.success).toBe(true)
  })

  it('rejects a title that is too short', () => {
    const result = updateFoodShareSchema.safeParse({
      title: 'ab',
    })

    expectIssuePath(result, 'title')
  })

  it('rejects an invalid status value', () => {
    const result = updateFoodShareSchema.safeParse({
      status: 'gone',
    })

    expectIssuePath(result, 'status')
  })

  it('accepts the minimum valid quantity', () => {
    const result = updateFoodShareSchema.safeParse({
      quantity: 1,
    })

    expect(result.success).toBe(true)
  })
})

describe('listFoodSharesSchema', () => {
  it('accepts a valid full payload', () => {
    const result = listFoodSharesSchema.safeParse({
      status: 'reserved',
      ownerId: VALID_UUID,
      search: makeString(100),
      limit: 50,
      page: 1,
    })

    expect(result.success).toBe(true)
  })

  it('accepts an empty payload because all fields are optional or defaulted', () => {
    expect(listFoodSharesSchema.safeParse({}).success).toBe(true)
  })

  it('rejects an invalid status value', () => {
    const result = listFoodSharesSchema.safeParse({ status: 'gone' })

    expectIssuePath(result, 'status')
  })

  it('accepts a search term at the maximum length', () => {
    const result = listFoodSharesSchema.safeParse({ search: makeString(100) })

    expect(result.success).toBe(true)
  })
})

describe('createFoodReservationSchema', () => {
  it('accepts a valid full payload', () => {
    const result = createFoodReservationSchema.safeParse({
      pickupAt: makeFutureIso(),
      notes: makeString(500),
    })

    expect(result.success).toBe(true)
  })

  it('rejects a missing required field', () => {
    const result = createFoodReservationSchema.safeParse({
      notes: 'I will come at the agreed time.',
    })

    expectIssuePath(result, 'pickupAt')
  })

  it('rejects an invalid pickup time', () => {
    const result = createFoodReservationSchema.safeParse({
      pickupAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    })

    expectIssuePath(result, 'pickupAt')
  })

  it('accepts a notes field at the maximum length', () => {
    const result = createFoodReservationSchema.safeParse({
      pickupAt: makeFutureIso(),
      notes: makeString(500),
    })

    expect(result.success).toBe(true)
  })
})

describe('updateFoodReservationSchema', () => {
  it('accepts a valid full payload', () => {
    const result = updateFoodReservationSchema.safeParse({
      action: 'approve',
      cancellationReason: makeString(500),
    })

    expect(result.success).toBe(true)
  })

  it('rejects a missing required field', () => {
    const result = updateFoodReservationSchema.safeParse({})

    expectIssuePath(result, 'action')
  })

  it('rejects an invalid action value', () => {
    const result = updateFoodReservationSchema.safeParse({
      action: 'archive',
    })

    expectIssuePath(result, 'action')
  })

  it('accepts a cancellation reason at the maximum length', () => {
    const result = updateFoodReservationSchema.safeParse({
      action: 'cancel',
      cancellationReason: makeString(500),
    })

    expect(result.success).toBe(true)
  })
})

describe('listFoodReservationsSchema', () => {
  it('accepts a valid full payload', () => {
    const result = listFoodReservationsSchema.safeParse({
      role: 'owner',
    })

    expect(result.success).toBe(true)
  })

  it('accepts an empty payload because the role has a default', () => {
    expect(listFoodReservationsSchema.safeParse({}).success).toBe(true)
  })

  it('rejects an invalid role value', () => {
    const result = listFoodReservationsSchema.safeParse({
      role: 'moderator',
    })

    expectIssuePath(result, 'role')
  })

  it('accepts the default role explicitly', () => {
    const result = listFoodReservationsSchema.safeParse({
      role: 'requester',
    })

    expect(result.success).toBe(true)
  })
})

describe('createSkillRequestSchema', () => {
  it('accepts an in_person payload without meetingUrl', () => {
    const result = createSkillRequestSchema.safeParse({
      skillId: VALID_UUID,
      scheduledStart: makeFutureIso(),
      scheduledEnd: makeFarFutureIso(),
      meetingType: 'in_person',
    })
    expect(result.success).toBe(true)
  })

  it('accepts an online payload with meetingUrl', () => {
    const result = createSkillRequestSchema.safeParse({
      skillId: VALID_UUID,
      scheduledStart: makeFutureIso(),
      scheduledEnd: makeFarFutureIso(),
      meetingType: 'online',
      meetingUrl: 'https://meet.example.com/room',
    })
    expect(result.success).toBe(true)
  })

  it('rejects online type without meetingUrl', () => {
    const result = createSkillRequestSchema.safeParse({
      skillId: VALID_UUID,
      scheduledStart: makeFutureIso(),
      scheduledEnd: makeFarFutureIso(),
      meetingType: 'online',
    })
    expectIssuePath(result, 'meetingUrl')
  })

  it('rejects scheduledEnd before scheduledStart', () => {
    const result = createSkillRequestSchema.safeParse({
      skillId: VALID_UUID,
      scheduledStart: makeFarFutureIso(),
      scheduledEnd: makeFutureIso(),
      meetingType: 'in_person',
    })
    expectIssuePath(result, 'scheduledEnd')
  })

  it('rejects scheduledStart in the past', () => {
    const result = createSkillRequestSchema.safeParse({
      skillId: VALID_UUID,
      scheduledStart: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      scheduledEnd: makeFutureIso(),
      meetingType: 'in_person',
    })
    expectIssuePath(result, 'scheduledStart')
  })
})

describe('patchSkillRequestSchema', () => {
  it('accepts accept action without cancellationReason', () => {
    expect(patchSkillRequestSchema.safeParse({ action: 'accept' }).success).toBe(true)
  })

  it('rejects cancel action without cancellationReason', () => {
    const result = patchSkillRequestSchema.safeParse({ action: 'cancel' })
    expectIssuePath(result, 'cancellationReason')
  })

  it('accepts cancel action with cancellationReason', () => {
    expect(patchSkillRequestSchema.safeParse({ action: 'cancel', cancellationReason: 'Changed plans.' }).success).toBe(true)
  })

  it('rejects an invalid action value', () => {
    const result = patchSkillRequestSchema.safeParse({ action: 'archive' })
    expectIssuePath(result, 'action')
  })
})

describe('listSkillRequestsSchema', () => {
  it('accepts an empty payload', () => {
    expect(listSkillRequestsSchema.safeParse({}).success).toBe(true)
  })

  it('rejects a page value below the minimum', () => {
    const result = listSkillRequestsSchema.safeParse({ page: 0 })
    expectIssuePath(result, 'page')
  })

  it('rejects an invalid status value', () => {
    const result = listSkillRequestsSchema.safeParse({ status: 'unknown' })
    expectIssuePath(result, 'status')
  })
})

describe('createRatingSchema', () => {
  it('accepts a valid full payload', () => {
    const result = createRatingSchema.safeParse({
      contextType: 'skill_request',
      contextId: VALID_UUID,
      ratedUserId: VALID_UUID,
      score: 5,
      comment: 'Excellent help!',
    })
    expect(result.success).toBe(true)
  })

  it('rejects a score below 1', () => {
    const result = createRatingSchema.safeParse({
      contextType: 'skill_request',
      contextId: VALID_UUID,
      ratedUserId: VALID_UUID,
      score: 0,
    })
    expectIssuePath(result, 'score')
  })

  it('rejects a score above 5', () => {
    const result = createRatingSchema.safeParse({
      contextType: 'skill_request',
      contextId: VALID_UUID,
      ratedUserId: VALID_UUID,
      score: 6,
    })
    expectIssuePath(result, 'score')
  })

  it('rejects an invalid contextType', () => {
    const result = createRatingSchema.safeParse({
      contextType: 'event_attendance',
      contextId: VALID_UUID,
      ratedUserId: VALID_UUID,
      score: 4,
    })
    expectIssuePath(result, 'contextType')
  })
})

describe('createDriveSchema', () => {
  it('accepts a valid payload', () => {
    expect(createDriveSchema.safeParse({ title: 'Winter Clothes Drive', driveType: 'items' }).success).toBe(true)
    expect(createDriveSchema.safeParse({ title: 'Volunteer Drive', driveType: 'volunteer' }).success).toBe(true)
  })

  it('rejects a title that is too short', () => {
    const result = createDriveSchema.safeParse({ title: 'ab', driveType: 'items' })
    expectIssuePath(result, 'title')
  })

  it('rejects an invalid driveType', () => {
    const result = createDriveSchema.safeParse({ title: 'Valid Title', driveType: 'electronics' })
    expectIssuePath(result, 'driveType')
  })

  it('accepts volunteer as a driveType', () => {
    expect(createDriveSchema.safeParse({ title: 'Volunteer Drive', driveType: 'volunteer' }).success).toBe(true)
  })

  it('rejects a deadline in the past', () => {
    const result = createDriveSchema.safeParse({
      title: 'Valid Title',
      driveType: 'food',
      deadline: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    })
    expectIssuePath(result, 'deadline')
  })
})

describe('listDrivesSchema', () => {
  it('accepts an empty payload', () => {
    expect(listDrivesSchema.safeParse({}).success).toBe(true)
  })

  it('rejects an invalid status value', () => {
    const result = listDrivesSchema.safeParse({ status: 'paused' })
    expectIssuePath(result, 'status')
  })

  it('rejects an invalid driveType value', () => {
    const result = listDrivesSchema.safeParse({ driveType: 'electronics' })
    expectIssuePath(result, 'driveType')
  })

  it('accepts volunteer as a listed driveType', () => {
    expect(listDrivesSchema.safeParse({ driveType: 'volunteer' }).success).toBe(true)
  })
})

describe('createPledgeSchema', () => {
  it('accepts a valid payload', () => {
    expect(createPledgeSchema.safeParse({ pledgeDescription: 'I will bring warm blankets.' }).success).toBe(true)
  })

  it('rejects a missing required field', () => {
    const result = createPledgeSchema.safeParse({})
    expectIssuePath(result, 'pledgeDescription')
  })

  it('rejects an empty pledge description', () => {
    const result = createPledgeSchema.safeParse({ pledgeDescription: '   ' })
    expectIssuePath(result, 'pledgeDescription')
  })
})

describe('createEventSchema', () => {
  it('accepts a valid payload', () => {
    expect(createEventSchema.safeParse({ title: 'Neighborhood Meetup', startsAt: makeFutureIso() }).success).toBe(true)
  })

  it('rejects a title that is too short', () => {
    const result = createEventSchema.safeParse({ title: 'ab', startsAt: makeFutureIso() })
    expectIssuePath(result, 'title')
  })

  it('rejects a startsAt in the past', () => {
    const result = createEventSchema.safeParse({
      title: 'Valid Title',
      startsAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    })
    expectIssuePath(result, 'startsAt')
  })

  it('rejects maxCapacity below 1', () => {
    const result = createEventSchema.safeParse({
      title: 'Valid Title',
      startsAt: makeFutureIso(),
      maxCapacity: 0,
    })
    expectIssuePath(result, 'maxCapacity')
  })
})

describe('listEventsSchema', () => {
  it('accepts an empty payload', () => {
    expect(listEventsSchema.safeParse({}).success).toBe(true)
  })

  it('rejects an invalid status value', () => {
    const result = listEventsSchema.safeParse({ status: 'draft' })
    expectIssuePath(result, 'status')
  })
})

describe('createToolReservationSchema', () => {
  it('accepts a valid payload', () => {
    const result = createToolReservationSchema.safeParse({
      toolId: VALID_UUID,
      startDate: makeFutureIso(),
      endDate: makeFarFutureIso(),
    })
    expect(result.success).toBe(true)
  })

  it('rejects endDate before startDate', () => {
    const result = createToolReservationSchema.safeParse({
      toolId: VALID_UUID,
      startDate: makeFarFutureIso(),
      endDate: makeFutureIso(),
    })
    expectIssuePath(result, 'endDate')
  })

  it('rejects a missing toolId', () => {
    const result = createToolReservationSchema.safeParse({
      startDate: makeFutureIso(),
      endDate: makeFarFutureIso(),
    })
    expectIssuePath(result, 'toolId')
  })
})

describe('patchToolReservationSchema', () => {
  it('accepts a valid action', () => {
    expect(patchToolReservationSchema.safeParse({ action: 'approve' }).success).toBe(true)
  })

  it('rejects a missing action', () => {
    const result = patchToolReservationSchema.safeParse({})
    expectIssuePath(result, 'action')
  })

  it('rejects an invalid action value', () => {
    const result = patchToolReservationSchema.safeParse({ action: 'archive' })
    expectIssuePath(result, 'action')
  })
})
