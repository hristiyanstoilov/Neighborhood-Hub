import { db } from '@/db'
import { notifications } from '@/db/schema'
import { sendPushNotification } from './push'

type NotificationInput = {
  userId: string
  type: string
  entityType: string
  entityId: string | null
  pushTitle?: string
  pushBody?: string
}

const DEFAULT_PUSH: Partial<Record<string, { title: string; body: string }>> = {
  new_request:          { title: 'New skill request',         body: 'Someone requested your skill.' },
  request_accepted:     { title: 'Request accepted',          body: 'Your skill request was accepted.' },
  request_declined:     { title: 'Request declined',          body: 'Your skill request was declined.' },
  request_completed:    { title: 'Request completed',         body: 'A skill request has been completed.' },
  new_tool_reservation: { title: 'Tool reservation request',  body: 'Someone wants to borrow your tool.' },
  reservation_accepted: { title: 'Reservation approved',      body: 'Your tool reservation was approved.' },
  reservation_rejected: { title: 'Reservation declined',      body: 'Your tool reservation was declined.' },
  new_food_reservation: { title: 'Food reservation request',  body: 'Someone wants your food share.' },
  food_reservation_accepted: { title: 'Food reservation approved', body: 'Your food reservation was approved.' },
  food_reservation_rejected: { title: 'Food reservation declined', body: 'Your food reservation was declined.' },
  event_rsvp:           { title: 'New RSVP',                  body: 'Someone RSVP\'d to your event.' },
  new_pledge:           { title: 'New pledge',                body: 'Someone pledged to your drive.' },
}

export async function createNotification(input: NotificationInput) {
  const { userId, type, entityType, entityId, pushTitle, pushBody } = input

  // Insert notification (fire-and-forget safe — callers already do .catch)
  await db.insert(notifications).values({ userId, type, entityType, entityId })

  // Send push notification non-blocking
  const defaults = DEFAULT_PUSH[type]
  const title = pushTitle ?? defaults?.title
  const body = pushBody ?? defaults?.body
  if (title && body) {
    void sendPushNotification(userId, title, body, { entityType, entityId })
  }
}
