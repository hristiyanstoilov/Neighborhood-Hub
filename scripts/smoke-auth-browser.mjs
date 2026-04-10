import { chromium } from 'playwright'

const BASE_URL = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3000'
const EMAIL = process.env.SMOKE_AUTH_EMAIL || ''
const PASSWORD = process.env.SMOKE_AUTH_PASSWORD || ''
const STRICT = process.env.SMOKE_AUTH_STRICT === 'true'

function fail(message) {
  throw new Error(message)
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
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' })
    const loginResult = await page.evaluate(
      async ({ email, password }) => {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        })

        return {
          status: response.status,
          body: await response.json().catch(() => null),
        }
      },
      { email: EMAIL, password: PASSWORD }
    )

    if (loginResult.status !== 200) {
      fail(`Expected login bootstrap to succeed, got ${loginResult.status}`)
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