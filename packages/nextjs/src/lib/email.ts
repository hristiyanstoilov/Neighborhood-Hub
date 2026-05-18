import { Resend } from 'resend'

function getConfig() {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!apiKey) throw new Error('RESEND_API_KEY env var is required')
  if (!from) throw new Error('RESEND_FROM env var is required')
  if (!appUrl) throw new Error('NEXT_PUBLIC_APP_URL env var is required')
  return { apiKey, from, appUrl }
}

let _resend: Resend | undefined
function getResend(): Resend {
  if (!_resend) _resend = new Resend(getConfig().apiKey)
  return _resend
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const { from, appUrl } = getConfig()
  const link = `${appUrl}/verify-email?token=${encodeURIComponent(token)}`

  await getResend().emails.send({
    from,
    to,
    subject: 'Verify your Neighborhood Hub account',
    html: `
      <h2>Welcome to Neighborhood Hub!</h2>
      <p>Click the link below to verify your email address. The link expires in 24 hours.</p>
      <a href="${link}" style="display:inline-block;padding:12px 24px;background:#15803d;color:#fff;border-radius:6px;text-decoration:none;">
        Verify Email
      </a>
      <p style="color:#6b7280;font-size:14px;margin-top:16px;">
        Or copy this link: ${link}
      </p>
    `,
  })
}

export async function sendContactEmail(params: {
  senderName: string
  senderEmail: string
  subject: string
  message: string
}): Promise<void> {
  const { from, appUrl: _appUrl } = getConfig()
  const to = process.env.CONTACT_EMAIL ?? from
  await getResend().emails.send({
    from,
    to,
    replyTo: params.senderEmail,
    subject: `[Contact] ${params.subject}`,
    html: `
      <h2>New contact message</h2>
      <p><strong>From:</strong> ${escapeHtml(params.senderName)} &lt;${escapeHtml(params.senderEmail)}&gt;</p>
      <p><strong>Subject:</strong> ${escapeHtml(params.subject)}</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
      <p style="white-space:pre-wrap;">${escapeHtml(params.message)}</p>
    `,
  })
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const { from, appUrl } = getConfig()
  const link = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`

  await getResend().emails.send({
    from,
    to,
    subject: 'Reset your Neighborhood Hub password',
    html: `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password. The link expires in 1 hour.</p>
      <a href="${link}" style="display:inline-block;padding:12px 24px;background:#15803d;color:#fff;border-radius:6px;text-decoration:none;">
        Reset Password
      </a>
      <p style="color:#6b7280;font-size:14px;margin-top:16px;">
        If you did not request this, ignore this email.
      </p>
    `,
  })
}

export async function sendSkillRequestAccepted(params: {
  to: string
  skillTitle: string
  scheduledStart: Date
}): Promise<void> {
  const { from, appUrl } = getConfig()
  const safeTitle = escapeHtml(params.skillTitle)
  await getResend().emails.send({
    from,
    to: params.to,
    subject: `Your skill request for "${params.skillTitle}" was accepted`,
    html: `
      <h2>Request accepted!</h2>
      <p>Your request for <strong>${safeTitle}</strong> has been accepted.</p>
      <p>Scheduled: ${params.scheduledStart.toLocaleString('en-GB')}</p>
      <a href="${appUrl}/my-requests" style="display:inline-block;padding:12px 24px;background:#15803d;color:#fff;border-radius:6px;text-decoration:none;">
        View your requests
      </a>
    `,
  })
}

export async function sendFoodReservationApproved(params: {
  to: string
  foodTitle: string
  pickupAt: Date
}): Promise<void> {
  const { from, appUrl } = getConfig()
  const safeTitle = escapeHtml(params.foodTitle)
  await getResend().emails.send({
    from,
    to: params.to,
    subject: `Your food reservation for "${params.foodTitle}" was approved`,
    html: `
      <h2>Reservation approved!</h2>
      <p>Your reservation for <strong>${safeTitle}</strong> has been approved.</p>
      <p>Pickup time: ${params.pickupAt.toLocaleString('en-GB')}</p>
      <a href="${appUrl}/food/reservations" style="display:inline-block;padding:12px 24px;background:#15803d;color:#fff;border-radius:6px;text-decoration:none;">
        View your reservations
      </a>
    `,
  })
}

export async function sendFoodPickedUp(params: {
  to: string
  foodTitle: string
}): Promise<void> {
  const { from } = getConfig()
  const safeTitle = escapeHtml(params.foodTitle)
  await getResend().emails.send({
    from,
    to: params.to,
    subject: `Food pickup confirmed — "${params.foodTitle}"`,
    html: `
      <h2>Pickup confirmed!</h2>
      <p>The pickup for <strong>${safeTitle}</strong> has been marked as completed.</p>
      <p>Thank you for using Neighborhood Hub!</p>
    `,
  })
}

export async function sendToolReservationApproved(params: {
  to: string
  toolTitle: string
  startDate: Date
  endDate: Date
}): Promise<void> {
  const { from, appUrl } = getConfig()
  const safeTitle = escapeHtml(params.toolTitle)
  await getResend().emails.send({
    from,
    to: params.to,
    subject: `Your tool reservation for "${params.toolTitle}" was approved`,
    html: `
      <h2>Reservation approved!</h2>
      <p>Your reservation for <strong>${safeTitle}</strong> has been approved.</p>
      <p>Period: ${params.startDate.toLocaleDateString('en-GB')} – ${params.endDate.toLocaleDateString('en-GB')}</p>
      <a href="${appUrl}/tools/reservations" style="display:inline-block;padding:12px 24px;background:#15803d;color:#fff;border-radius:6px;text-decoration:none;">
        View your reservations
      </a>
    `,
  })
}

export async function sendToolReservationRejected(params: {
  to: string
  toolTitle: string
}): Promise<void> {
  const { from, appUrl } = getConfig()
  const safeTitle = escapeHtml(params.toolTitle)
  await getResend().emails.send({
    from,
    to: params.to,
    subject: `Your tool reservation for "${params.toolTitle}" was declined`,
    html: `
      <h2>Reservation declined</h2>
      <p>Unfortunately, your reservation request for <strong>${safeTitle}</strong> was declined by the owner.</p>
      <a href="${appUrl}/tools" style="display:inline-block;padding:12px 24px;background:#15803d;color:#fff;border-radius:6px;text-decoration:none;">
        Browse other tools
      </a>
    `,
  })
}

export async function sendEventRsvpConfirmation(params: {
  to: string
  eventTitle: string
  startsAt: Date
}): Promise<void> {
  const { from, appUrl } = getConfig()
  const safeTitle = escapeHtml(params.eventTitle)
  await getResend().emails.send({
    from,
    to: params.to,
    subject: `You're going to "${params.eventTitle}"`,
    html: `
      <h2>RSVP confirmed!</h2>
      <p>You're registered for <strong>${safeTitle}</strong>.</p>
      <p>Starts: ${params.startsAt.toLocaleString('en-GB')}</p>
      <a href="${appUrl}/events" style="display:inline-block;padding:12px 24px;background:#15803d;color:#fff;border-radius:6px;text-decoration:none;">
        View events
      </a>
    `,
  })
}

export async function sendDrivePledgeFulfilled(params: {
  to: string
  driveTitle: string
}): Promise<void> {
  const { from, appUrl } = getConfig()
  const safeTitle = escapeHtml(params.driveTitle)
  await getResend().emails.send({
    from,
    to: params.to,
    subject: `Your pledge for "${params.driveTitle}" has been marked fulfilled`,
    html: `
      <h2>Pledge fulfilled!</h2>
      <p>The organizer has marked your pledge for <strong>${safeTitle}</strong> as fulfilled. Thank you for contributing!</p>
      <a href="${appUrl}/drives" style="display:inline-block;padding:12px 24px;background:#15803d;color:#fff;border-radius:6px;text-decoration:none;">
        View community drives
      </a>
    `,
  })
}
