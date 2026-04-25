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
  // Skill requests
  new_request:                { title: 'New skill request',          body: 'Someone requested your skill.' },
  request_accepted:           { title: 'Request accepted',           body: 'Your skill request was accepted.' },
  request_rejected:           { title: 'Request declined',           body: 'Your skill request was declined.' },
  request_completed:          { title: 'Request completed',          body: 'A skill request has been completed.' },
  request_cancelled:          { title: 'Request cancelled',          body: 'A skill request was cancelled.' },
  // Tool reservations
  reservation_new:            { title: 'Tool reservation request',   body: 'Someone wants to borrow your tool.' },
  reservation_approved:       { title: 'Reservation approved',       body: 'Your tool reservation was approved.' },
  reservation_rejected:       { title: 'Reservation declined',       body: 'Your tool reservation was declined.' },
  reservation_returned:       { title: 'Tool returned',              body: 'Your tool has been returned.' },
  reservation_cancelled:      { title: 'Reservation cancelled',      body: 'A tool reservation was cancelled.' },
  // Food reservations
  food_reservation_new:       { title: 'Food reservation request',   body: 'Someone wants your food share.' },
  food_reservation_approved:  { title: 'Food reservation approved',  body: 'Your food reservation was approved.' },
  food_reservation_rejected:  { title: 'Food reservation declined',  body: 'Your food reservation was declined.' },
  food_reservation_cancelled: { title: 'Reservation cancelled',      body: 'Your food reservation was cancelled.' },
  food_reservation_picked_up: { title: 'Pickup confirmed',           body: 'The food share has been picked up.' },
  // Events
  event_new_rsvp:             { title: 'New RSVP',                   body: 'Someone RSVP\'d to your event.' },
  event_rsvp_cancelled:       { title: 'RSVP cancelled',             body: 'Someone cancelled their RSVP.' },
  event_cancelled:            { title: 'Event cancelled',            body: 'An event you RSVP\'d to was cancelled.' },
  // Drives
  drive_new_pledge:           { title: 'New pledge',                 body: 'Someone pledged to your drive.' },
  drive_pledge_fulfilled:     { title: 'Pledge fulfilled',           body: 'Your drive pledge was marked complete.' },
  drive_pledge_cancelled:     { title: 'Pledge cancelled',           body: 'A pledge to your drive was cancelled.' },
  drive_completed:            { title: 'Drive completed',            body: 'A drive you pledged to was completed.' },
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
