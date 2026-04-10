import { Storage } from './storage'

const BASE = process.env.EXPO_PUBLIC_API_URL ?? ''
const RETRYABLE_STATUS = new Set([429, 502, 503, 504])
const RETRYABLE_METHODS = new Set(['GET', 'HEAD'])
const MAX_RETRIES = 2
const BASE_BACKOFF_MS = 250

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

function getMethod(options?: RequestInit) {
  return (options?.method ?? 'GET').toUpperCase()
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function buildFetchOptions(options: RequestInit | undefined, token: string | null): RequestInit {
  const isFormData = options?.body instanceof FormData

  return {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  }
}

async function fetchWithRetry(path: string, options: RequestInit | undefined, token: string | null): Promise<Response> {
  const method = getMethod(options)

  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(`${BASE}${path}`, buildFetchOptions(options, token))

      if (RETRYABLE_METHODS.has(method) && RETRYABLE_STATUS.has(res.status) && attempt < MAX_RETRIES) {
        const jitter = Math.floor(Math.random() * 120)
        await delay(BASE_BACKOFF_MS * 2 ** attempt + jitter)
        continue
      }

      return res
    } catch {
      if (RETRYABLE_METHODS.has(method) && attempt < MAX_RETRIES) {
        const jitter = Math.floor(Math.random() * 120)
        await delay(BASE_BACKOFF_MS * 2 ** attempt + jitter)
        continue
      }

      throw new Error('NETWORK_ERROR')
    }
  }
}

export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  try {
    let res = await fetchWithRetry(path, options, _accessToken)

    if (res.status === 401) {
      const newToken = await refreshAccessToken()
      if (newToken) {
        res = await fetchWithRetry(path, options, newToken)
      }
    }

    return res
  } catch {
    // Network error — return a synthetic offline response
    return new Response(JSON.stringify({ error: 'NETWORK_ERROR' }), {
      status: 0,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
