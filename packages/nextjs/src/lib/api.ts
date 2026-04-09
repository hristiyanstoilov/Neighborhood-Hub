const BASE = typeof window === 'undefined' ? process.env.NEXT_PUBLIC_APP_URL ?? '' : ''

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

async function refreshAccessToken(): Promise<string | null> {
  const res = await fetch(`${BASE}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) return null
  const json = await res.json()
  const newToken = json.data?.accessToken ?? null
  accessToken = newToken
  return newToken
}

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers)
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }
  // Don't set Content-Type for FormData — fetch sets it automatically with the multipart boundary
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  // Token expired — try refresh once then retry
  if (res.status === 401 && accessToken) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`)
      return fetch(`${BASE}${path}`, {
        ...options,
        headers,
        credentials: 'include',
      })
    }
    // Refresh failed — clear token so app knows user is logged out
    accessToken = null
  }

  return res
}
