import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY env var is required')
if (!process.env.RESEND_FROM) throw new Error('RESEND_FROM env var is required')
if (!process.env.NEXT_PUBLIC_APP_URL) throw new Error('NEXT_PUBLIC_APP_URL env var is required')

const resend = new Resend(process.env.RESEND_API_KEY)

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
const FROM = process.env.RESEND_FROM
const APP_URL = process.env.NEXT_PUBLIC_APP_URL

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const link = `${APP_URL}/verify-email?token=${encodeURIComponent(token)}`

  await resend.emails.send({
    from: FROM,
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
  const to = process.env.CONTACT_EMAIL ?? FROM
  await resend.emails.send({
    from: FROM,
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
  const link = `${APP_URL}/reset-password?token=${encodeURIComponent(token)}`

  await resend.emails.send({
    from: FROM,
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
  const safeTitle = escapeHtml(params.skillTitle)
  await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `Your skill request for "${params.skillTitle}" was accepted`,
    html: `
      <h2>Request accepted!</h2>
      <p>Your request for <strong>${safeTitle}</strong> has been accepted.</p>
      <p>Scheduled: ${params.scheduledStart.toLocaleString('en-GB')}</p>
      <a href="${APP_URL}/my-requests" style="display:inline-block;padding:12px 24px;background:#15803d;color:#fff;border-radius:6px;text-decoration:none;">
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
  const safeTitle = escapeHtml(params.foodTitle)
  await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `Your food reservation for "${params.foodTitle}" was approved`,
    html: `
      <h2>Reservation approved!</h2>
      <p>Your reservation for <strong>${safeTitle}</strong> has been approved.</p>
      <p>Pickup time: ${params.pickupAt.toLocaleString('en-GB')}</p>
      <a href="${APP_URL}/food/reservations" style="display:inline-block;padding:12px 24px;background:#15803d;color:#fff;border-radius:6px;text-decoration:none;">
        View your reservations
      </a>
    `,
  })
}

export async function sendFoodPickedUp(params: {
  to: string
  foodTitle: string
}): Promise<void> {
  const safeTitle = escapeHtml(params.foodTitle)
  await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: `Food pickup confirmed — "${params.foodTitle}"`,
    html: `
      <h2>Pickup confirmed!</h2>
      <p>The pickup for <strong>${safeTitle}</strong> has been marked as completed.</p>
      <p>Thank you for using Neighborhood Hub!</p>
    `,
  })
}
