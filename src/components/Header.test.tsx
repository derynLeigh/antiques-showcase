import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderToString } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Header } from '@/components/Header'

// Each test sets the current page by changing pathname.current.
const pathname = vi.hoisted(() => ({ current: '/' }))
vi.mock('next/navigation', () => ({ usePathname: () => pathname.current }))

// Each test can set the resolved theme and check what setTheme was called with.
const theme = vi.hoisted(() => ({
  resolvedTheme: 'light' as string | undefined,
  setTheme: vi.fn(),
}))
vi.mock('next-themes', () => ({ useTheme: () => theme }))

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
// the mobile menu, the theme toggle and the link home. The scroll-driven
// avatar animation is not tested here; see docs/component-behaviours.md.
describe('Header', () => {
  beforeEach(() => {
    pathname.current = '/'
    theme.resolvedTheme = 'light'
    theme.setTheme.mockClear()
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

  describe('theme toggle', () => {
    // The server can't know the visitor's theme, so the first render must use
    // a neutral label or hydration would mismatch. render() runs effects at
    // once, so the server render is checked as HTML, the way Next produces it.
    it('is labelled "Toggle theme" when rendered on the server', () => {
      const container = document.createElement('div')
      container.innerHTML = renderToString(<Header />)
      document.body.append(container)

      try {
        expect(
          within(container).getByRole('button', { name: 'Toggle theme' }),
        ).toBeInTheDocument()
      } finally {
        container.remove()
      }
    })

    it.each([
      ['light', 'Switch to dark theme'],
      ['dark', 'Switch to light theme'],
    ])(
      'in the %s theme, is labelled "%s" once mounted',
      (resolvedTheme, label) => {
        theme.resolvedTheme = resolvedTheme
        render(<Header />)

        expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
      },
    )

    it.each([
      ['light', 'dark'],
      ['dark', 'light'],
    ])(
      'in the %s theme, switches to %s when clicked',
      async (resolvedTheme, otherTheme) => {
        const user = userEvent.setup()
        theme.resolvedTheme = resolvedTheme
        render(<Header />)

        await user.click(
          screen.getByRole('button', { name: `Switch to ${otherTheme} theme` }),
        )

        expect(theme.setTheme).toHaveBeenCalledExactlyOnceWith(otherTheme)
      },
    )
  })

  describe('link home', () => {
    // On the home page it's the large avatar, elsewhere the small one. The
    // size is styling; what matters is that every page has exactly one.
    it.each(['/', '/about'])('appears once on %s', (path) => {
      pathname.current = path
      render(<Header />)

      expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
        'href',
        '/',
      )
    })
  })
})
