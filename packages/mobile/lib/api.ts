import { Storage } from './storage'

const BASE = process.env.EXPO_PUBLIC_API_URL ?? ''

let _accessToken: string | null = null

export function setAccessToken(token: string | null) {
  _accessToken = token
}

export function getAccessToken(): string | null {
  return _accessToken
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await Storage.get('refresh_token')
  if (!refreshToken) return null

  try {
    const res = await fetch(`${BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    if (!res.ok) {
      await Storage.delete('refresh_token')
      return null
    }

    const json = await res.json()
    const newAccess: string | undefined = json.data?.accessToken
    const newRefresh: string | undefined = json.data?.refreshToken

    if (newRefresh) await Storage.set('refresh_token', newRefresh)
    if (newAccess) _accessToken = newAccess

    return newAccess ?? null
  } catch {
    return null
  }
}

export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const doFetch = (token: string | null) =>
    fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options?.headers ?? {}),
      },
    })

  let res = await doFetch(_accessToken)

  if (res.status === 401) {
    const newToken = await refreshAccessToken()
    res = await doFetch(newToken)
  }

  return res
}
