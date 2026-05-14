import { test, expect } from '@playwright/test'

test('home page matches snapshot', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('home.png', { maxDiffPixelRatio: 0.02 })
})

test('skills list page matches snapshot', async ({ page }) => {
  await page.goto('/skills')
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('skills-list.png', { maxDiffPixelRatio: 0.02 })
})

test('food list page matches snapshot', async ({ page }) => {
  await page.goto('/food')
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('food-list.png', { maxDiffPixelRatio: 0.02 })
})

test('events list page matches snapshot', async ({ page }) => {
  await page.goto('/events')
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('events-list.png', { maxDiffPixelRatio: 0.02 })
})
