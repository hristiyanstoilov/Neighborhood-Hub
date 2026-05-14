import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const PUBLIC_ROUTES = [
  { name: 'home',         path: '/' },
  { name: 'skills list',  path: '/skills' },
  { name: 'food list',    path: '/food' },
  { name: 'events list',  path: '/events' },
  { name: 'login',        path: '/login' },
  { name: 'register',     path: '/register' },
]

for (const route of PUBLIC_ROUTES) {
  test(`${route.name} has no critical WCAG 2.1 AA violations`, async ({ page }) => {
    await page.goto(route.path)
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()

    const blocking = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )

    if (blocking.length > 0) {
      console.log('Accessibility violations:')
      blocking.forEach((v) => {
        console.log(`  [${v.impact}] ${v.id}: ${v.description}`)
        v.nodes.forEach((n) => console.log(`    - ${n.html}`))
      })
    }

    expect(blocking, 'Critical/serious WCAG 2.1 AA violations found').toHaveLength(0)
  })
}
