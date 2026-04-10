const BASE = typeof window === 'undefined' ? process.env.NEXT_PUBLIC_APP_URL ?? '' : ''
const RETRYABLE_STATUS = new Set([429, 502, 503, 504])
const RETRYABLE_METHODS = new Set(['GET', 'HEAD'])
const MAX_RETRIES = 2
const BASE_BACKOFF_MS = 250

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

function getMethod(options: RequestInit) {
  return (options.method ?? 'GET').toUpperCase()
}

function shouldRetry(method: string, status: number, attempt: number) {
  return RETRYABLE_METHODS.has(method) && RETRYABLE_STATUS.has(status) && attempt < MAX_RETRIES
}

function shouldRetryOnError(method: string, attempt: number) {
  return RETRYABLE_METHODS.has(method) && attempt < MAX_RETRIES
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchWithRetry(url: string, options: RequestInit): Promise<Response> {
  const method = getMethod(options)

  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, options)

      if (shouldRetry(method, res.status, attempt)) {
        const jitter = Math.floor(Math.random() * 120)
        await delay(BASE_BACKOFF_MS * 2 ** attempt + jitter)
        continue
      }

      return res
    } catch (err) {
      if (shouldRetryOnError(method, attempt)) {
        const jitter = Math.floor(Math.random() * 120)
        await delay(BASE_BACKOFF_MS * 2 ** attempt + jitter)
        continue
      }
      throw err
    }
  }
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

  const res = await fetchWithRetry(`${BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  // Token expired — try refresh once then retry
  if (res.status === 401 && accessToken) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`)
      return fetchWithRetry(`${BASE}${path}`, {
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
