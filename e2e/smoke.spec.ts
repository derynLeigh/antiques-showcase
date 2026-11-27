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

// The smoke build copies the fixture pieces in under smoke- names.
const teaCaddy = {
  path: '/collection/smoke-georgian-tea-caddy',
  title: 'Georgian silver tea caddy',
  photo: 'Oval silver tea caddy with a domed lid, on a linen backdrop',
}
const connie = {
  title: "Lockheed Constellation 'Connie' shop display model",
}

test.describe('collection page', () => {
  // On a phone the navigation is behind the Menu button.
  test('is reached from the main navigation', async ({ page, isMobile }) => {
    const errors = watchForErrors(page)
    await page.goto('/')

    if (isMobile) await page.getByRole('button', { name: 'Menu' }).click()
    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: 'Collection' })
      .click()

    await expect(page).toHaveURL('/collection')
    await expect(
      page.getByRole('heading', { level: 1, name: 'The collection' }),
    ).toBeVisible()
    expect(errors).toEqual([])
  })

  // The click lands where a visitor would tap: the middle of the photo. The
  // card's link covers the whole card, so the tap goes to the link, as long
  // as the photo sits below it (see the collection page).
  test("lists the pieces, and a card's photo opens its piece", async ({
    page,
  }) => {
    const errors = watchForErrors(page)
    await page.goto('/collection')

    const cards = page.getByRole('article')
    await expect(cards.filter({ hasText: teaCaddy.title })).toHaveCount(1)
    await expect(cards.filter({ hasText: connie.title })).toHaveCount(1)

    const photo = page.getByRole('img', { name: teaCaddy.photo })
    await photo.scrollIntoViewIfNeeded()
    const box = await photo.boundingBox()
    if (!box) throw new Error("The tea caddy's photo isn't on screen")
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)

    await expect(page).toHaveURL(teaCaddy.path)
    await expect(
      page.getByRole('heading', { level: 1, name: teaCaddy.title }),
    ).toBeVisible()
    expect(errors).toEqual([])
  })
})
