import { APIRequestContext } from '@playwright/test'

export async function registerAndLogin(request: APIRequestContext, email: string, password: string) {
  // Register
  const reg = await request.post('/api/auth/register', {
    data: { email, password },
  })
  // 409 if user already exists from previous run — OK, proceed to login
  // 201 if successful
  if (![200, 201, 409].includes(reg.status())) {
    throw new Error(`Register failed: ${reg.status()}`)
  }

  // Login
  const login = await request.post('/api/auth/login', {
    data: { email, password },
  })
  if (login.status() !== 200) {
    throw new Error(`Login failed: ${login.status()}`)
  }

  const loginJson = await login.json()
  const token = loginJson.data?.accessToken as string | null
  if (!token) {
    throw new Error('No access token in login response')
  }
  return token
}
