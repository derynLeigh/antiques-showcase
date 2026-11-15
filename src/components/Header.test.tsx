import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Header } from '@/components/Header'

// Each test sets the current page by changing pathname.current.
const pathname = vi.hoisted(() => ({ current: '/' }))
vi.mock('next/navigation', () => ({ usePathname: () => pathname.current }))

// Opens the mobile menu and returns its nav. Both navs are called "Main", and
// jsdom ignores the CSS that hides one of them, so the mobile nav is found as
// the one that wasn't there before Menu was clicked.
async function openMobileNav(user: ReturnType<typeof userEvent.setup>) {
  const before = screen.getAllByRole('navigation')

  await user.click(screen.getByRole('button', { name: 'Menu' }))

  const opened = screen
    .getAllByRole('navigation')
    .filter((nav) => !before.includes(nav))
  expect(opened).toHaveLength(1)

  return opened[0]
}

// Header is the site's main navigation. What matters is what a visitor or
// screen reader can find and use: the links, which one is the current page,
// and the mobile menu. The scroll-driven avatar animation is covered
// separately once its maths is extracted; see docs/component-behaviours.md.
describe('Header', () => {
  beforeEach(() => {
    pathname.current = '/'
  })

  describe('desktop navigation', () => {
    it('is labelled Main', () => {
      render(<Header />)

      expect(
        screen.getByRole('navigation', { name: 'Main' }),
      ).toBeInTheDocument()
    })

    it('lists About and Articles', () => {
      render(<Header />)

      const nav = screen.getByRole('navigation', { name: 'Main' })
      const links = within(nav).getAllByRole('link')

      expect(links.map((link) => link.textContent)).toEqual([
        'About',
        'Articles',
      ])
    })

    it('marks the link for the current page', () => {
      pathname.current = '/articles'
      render(<Header />)

      const nav = screen.getByRole('navigation', { name: 'Main' })

      expect(
        within(nav).getByRole('link', { name: 'Articles', current: 'page' }),
      ).toBeInTheDocument()
      expect(
        within(nav).getByRole('link', { name: 'About', current: false }),
      ).toBeInTheDocument()
    })
  })

  describe('mobile navigation', () => {
    it('is labelled Main', async () => {
      const user = userEvent.setup()
      render(<Header />)

      const nav = await openMobileNav(user)

      expect(nav).toHaveAccessibleName('Main')
    })

    it('lists About and Articles', async () => {
      const user = userEvent.setup()
      render(<Header />)

      const nav = await openMobileNav(user)
      const links = within(nav).getAllByRole('link')

      expect(links.map((link) => link.textContent)).toEqual([
        'About',
        'Articles',
      ])
    })

    it('marks the link for the current page', async () => {
      const user = userEvent.setup()
      pathname.current = '/articles'
      render(<Header />)

      const nav = await openMobileNav(user)

      expect(
        within(nav).getByRole('link', { name: 'Articles', current: 'page' }),
      ).toBeInTheDocument()
      expect(
        within(nav).getByRole('link', { name: 'About', current: false }),
      ).toBeInTheDocument()
    })

    it('opens when Menu is clicked', async () => {
      const user = userEvent.setup()
      render(<Header />)

      expect(
        screen.getByRole('button', { name: 'Menu', expanded: false }),
      ).toBeInTheDocument()

      await openMobileNav(user)

      expect(
        screen.getByRole('button', { name: 'Menu', expanded: true }),
      ).toBeInTheDocument()
    })

    // The panel fades out, so it leaves the page a moment after closing.
    it('closes when Close menu is clicked', async () => {
      const user = userEvent.setup()
      render(<Header />)
      const nav = await openMobileNav(user)

      await user.click(screen.getByRole('button', { name: 'Close menu' }))

      await waitFor(() => expect(nav).not.toBeInTheDocument())
      expect(
        screen.getByRole('button', { name: 'Menu', expanded: false }),
      ).toBeInTheDocument()
    })

    it('closes when Escape is pressed', async () => {
      const user = userEvent.setup()
      render(<Header />)
      const nav = await openMobileNav(user)

      await user.keyboard('{Escape}')

      await waitFor(() => expect(nav).not.toBeInTheDocument())
      expect(
        screen.getByRole('button', { name: 'Menu', expanded: false }),
      ).toBeInTheDocument()
    })
  })
})
