import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM = process.env.RESEND_FROM!
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const link = `${APP_URL}/verify-email?token=${token}`

  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Verify your Neighborhood Hub account',
    html: `
      <h2>Welcome to Neighborhood Hub!</h2>
      <p>Click the link below to verify your email address. The link expires in 24 hours.</p>
      <a href="${link}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;">
        Verify Email
      </a>
      <p style="color:#6b7280;font-size:14px;margin-top:16px;">
        Or copy this link: ${link}
      </p>
    `,
  })
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const link = `${APP_URL}/reset-password?token=${token}`

  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Reset your Neighborhood Hub password',
    html: `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password. The link expires in 1 hour.</p>
      <a href="${link}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;">
        Reset Password
      </a>
      <p style="color:#6b7280;font-size:14px;margin-top:16px;">
        If you did not request this, ignore this email.
      </p>
    `,
  })
}
