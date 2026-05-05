import { db } from '@/db'
import { feedEvents, profiles } from '@/db/schema'
import { eq } from 'drizzle-orm'

interface FeedEventInput {
  actorId:    string
  eventType:  string
  targetId:   string
  targetTitle: string
  targetUrl:  string
}

export async function createFeedEvent(input: FeedEventInput): Promise<void> {
  const actorProfile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, input.actorId),
    columns: { name: true },
  })

  await db.insert(feedEvents).values({
    actorId:     input.actorId,
    actorName:   actorProfile?.name ?? 'Neighbor',
    eventType:   input.eventType,
    targetId:    input.targetId,
    targetTitle: input.targetTitle,
    targetUrl:   input.targetUrl,
  })
}
