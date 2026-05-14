import dotenv from 'dotenv'
import { Client } from 'pg'

dotenv.config({ path: `${process.cwd()}/.env.local` })

async function getVerificationToken(email: string) {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()

  try {
    const result = await client.query<{ email_verification_token: string | null }>(
      'select email_verification_token from users where email = $1 limit 1',
      [email],
    )

    return result.rows[0]?.email_verification_token ?? null
  } finally {
    await client.end()
  }
}

export async function registerAndVerifyUser(
  request: { post: (url: string, options?: { data?: unknown }) => Promise<{ status(): number }> },
  email: string,
  password: string,
) {
  const registerResponse = await request.post('/api/auth/register', { data: { email, password } })
  if (registerResponse.status() !== 201 && registerResponse.status() !== 409) {
    throw new Error(`Registration failed for ${email} with status ${registerResponse.status()}`)
  }

  const token = await getVerificationToken(email)
  if (!token) {
    return
  }

  const verifyResponse = await request.post('/api/auth/verify-email', { data: { token } })
  if (verifyResponse.status() !== 200) {
    throw new Error(`Verification failed for ${email} with status ${verifyResponse.status()}`)
  }
}
