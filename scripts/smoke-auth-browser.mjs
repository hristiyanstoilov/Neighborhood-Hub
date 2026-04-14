import { chromium } from 'playwright'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const BASE_URL = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3000'
const EMAIL = process.env.SMOKE_AUTH_EMAIL || ''
const PASSWORD = process.env.SMOKE_AUTH_PASSWORD || ''
const REFRESH_TOKEN = process.env.SMOKE_AUTH_REFRESH_TOKEN || ''
const STRICT = process.env.SMOKE_AUTH_STRICT === 'true'
const MAX_LOGIN_RETRIES = Math.max(1, Number(process.env.SMOKE_AUTH_LOGIN_RETRIES || '3'))
const CACHE_FILE = path.join(os.tmpdir(), 'neighborhood-hub-smoke-refresh-token.json')

function fail(message) {
  throw new Error(message)
}

async function readCachedRefreshToken() {
  try {
    const raw = await fs.readFile(CACHE_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.refreshToken === 'string' && parsed.refreshToken) {
      return parsed.refreshToken
    }
  } catch {
    // No cache yet.
  }

  return null
}

async function writeCachedRefreshToken(refreshToken) {
  try {
    await fs.writeFile(CACHE_FILE, JSON.stringify({ refreshToken }), 'utf8')
  } catch {
    // Best-effort cache.
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseRetryAfterMs(value) {
  if (!value) return null
  const secs = Number(value)
  if (Number.isFinite(secs) && secs > 0) {
    return secs * 1000
  }

  const dateTs = Date.parse(value)
  if (!Number.isNaN(dateTs)) {
    const diff = dateTs - Date.now()
    return diff > 0 ? diff : null
  }

  return null
}

function extractRefreshTokenFromSetCookie(setCookieHeader) {
  if (!setCookieHeader) return null
  const match = setCookieHeader.match(/(?:^|[,;]\s*)refresh_token=([^;]+)/i)
  return match?.[1] ?? null
}

async function bootstrapFromRefreshToken(page, refreshToken) {
  if (!refreshToken) {
    return { ok: false, rotatedRefreshToken: null }
  }

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' })
  await page.evaluate((token) => {
    document.cookie = `refresh_token=${token}; path=/`
  }, refreshToken)

  const refreshResult = await page.evaluate(async () => {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    })

    return {
      status: response.status,
      body: await response.json().catch(() => null),
    }
  })

  const rotatedRefreshToken = refreshResult.body?.data?.refreshToken ?? null
  return {
    ok: refreshResult.status === 200,
    rotatedRefreshToken,
  }
}

async function loginWithRetry() {
  for (let attempt = 0; attempt < MAX_LOGIN_RETRIES; attempt += 1) {
    const forwardedFor = `127.0.0.${20 + attempt}`
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': forwardedFor,
      },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    })

    const body = await response.json().catch(() => null)
    const retryAfterMs = parseRetryAfterMs(response.headers.get('retry-after'))

    if (response.status === 200) {
      const bodyRefreshToken = body?.data?.refreshToken
      const headerRefreshToken = extractRefreshTokenFromSetCookie(response.headers.get('set-cookie'))
      return {
        status: 200,
        refreshToken: bodyRefreshToken || headerRefreshToken || null,
      }
    }

    if (response.status !== 429) {
      return {
        status: response.status,
        refreshToken: null,
      }
    }

    if (attempt < MAX_LOGIN_RETRIES - 1) {
      const backoffMs = retryAfterMs ?? 1000 * 2 ** attempt
      await delay(backoffMs)
    }
  }

  return {
    status: 429,
    refreshToken: null,
  }
}

async function main() {
  console.log(`Running authenticated browser smoke checks against ${BASE_URL}`)

  if (!EMAIL || !PASSWORD) {
    const message = 'SMOKE_AUTH_EMAIL or SMOKE_AUTH_PASSWORD is not set'
    if (STRICT) {
      fail(`Authenticated browser smoke failed: ${message}`)
    }
    console.log(`Skipping authenticated browser smoke: ${message}`)
    return
  }

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    let bootstrapped = false

    const cachedRefreshToken = await readCachedRefreshToken()
    const refreshCandidates = [REFRESH_TOKEN, cachedRefreshToken].filter(Boolean)

    for (const token of refreshCandidates) {
      const result = await bootstrapFromRefreshToken(page, token)
      if (result.ok) {
        bootstrapped = true
        if (result.rotatedRefreshToken) {
          await writeCachedRefreshToken(result.rotatedRefreshToken)
        }
        break
      }
    }

    if (!bootstrapped) {
      const loginResult = await loginWithRetry()

      if (loginResult.status === 429) {
        if (STRICT) {
          fail('Login bootstrap was rate-limited (429) after retries')
        }
        console.log('Skipping authenticated browser smoke: login bootstrap hit rate limit (429) after retries')
        return
      }

      if (loginResult.status !== 200) {
        fail(`Expected login bootstrap to succeed, got ${loginResult.status}`)
      }

      if (loginResult.refreshToken) {
        await writeCachedRefreshToken(loginResult.refreshToken)
        const refreshBootstrap = await bootstrapFromRefreshToken(page, loginResult.refreshToken)
        if (!refreshBootstrap.ok) {
          fail('Expected refresh-token bootstrap to succeed after login')
        }
      }
    }

    await page.goto(`${BASE_URL}/chat`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2500)

    const composer = page.getByPlaceholder('Ask something… (Enter to send, Shift+Enter for new line)')
    if ((await composer.count()) === 0) {
      fail('Expected chat composer to be present for authenticated user')
    }

    const authResult = await page.evaluate(async () => {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      })

      return {
        status: response.status,
        body: await response.json().catch(() => null),
      }
    })

    if (authResult.status !== 200) {
      fail(`Expected browser-context refresh to succeed, got ${authResult.status}`)
    }

    const accessToken = authResult.body?.data?.accessToken
    if (!accessToken) {
      fail('Expected browser-context refresh response to include accessToken')
    }

    const chatResult = await page.evaluate(
      async ({ accessToken }) => {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${accessToken}`,
          },
          credentials: 'include',
          body: JSON.stringify({ message: 'Auth browser smoke: explain radar shortly.' }),
        })

        return {
          status: response.status,
          body: await response.json().catch(() => null),
        }
      },
      { accessToken }
    )

    if (![200, 429, 503].includes(chatResult.status)) {
      fail(`Expected /api/ai/chat status 200/429/503, got ${chatResult.status}`)
    }

    if (chatResult.status === 200) {
      const conversationId = chatResult.body?.data?.conversationId
      if (!conversationId) {
        fail('Expected successful chat response to include conversationId')
      }
    }

    const notificationsButton = page.getByRole('button', { name: /^Notifications/ })
    if (await notificationsButton.count()) {
      await notificationsButton.click()
      await page.waitForTimeout(400)

      const menuCount = await page.locator('[role="menu"][aria-label="Notifications menu"]').count()
      if (menuCount === 0) {
        fail('Expected notifications menu to open')
      }
    }

    console.log(`OK authenticated browser smoke: chatStatus=${chatResult.status}`)
  } finally {
    await context.close()
    await browser.close()
  }
}

main().catch((err) => {
  console.error(`Authenticated browser smoke failed: ${err.message}`)
  process.exit(1)
})