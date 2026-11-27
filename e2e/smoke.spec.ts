import { expect, test, type Page } from '@playwright/test'

// Collects anything the browser reports as an error while a test runs: script
// errors on the page, and console errors (such as a failed image or script).
// Vercel's analytics script only exists on Vercel, so its 404 here is
// expected and left out.
function watchForErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() !== 'error') return
    if (message.location().url.includes('/_vercel/insights/')) return
    errors.push(message.text())
  })
  return errors
}

test.describe('home page', () => {
  test('loads with its heading and no errors', async ({ page }) => {
    const errors = watchForErrors(page)

    const response = await page.goto('/')

    expect(response?.ok()).toBe(true)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(errors).toEqual([])
  })
})
