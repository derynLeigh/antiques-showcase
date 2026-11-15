import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Header } from '@/components/Header'

// Each test sets the current page by changing pathname.current.
const pathname = vi.hoisted(() => ({ current: '/' }))
vi.mock('next/navigation', () => ({ usePathname: () => pathname.current }))

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

      const links = within(screen.getByRole('navigation')).getAllByRole('link')

      expect(links.map((link) => link.textContent)).toEqual([
        'About',
        'Articles',
      ])
    })

    it('marks the link for the current page', () => {
      pathname.current = '/articles'
      render(<Header />)

      const nav = screen.getByRole('navigation')

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

      await user.click(screen.getByRole('button', { name: 'Menu' }))

      // In a browser only one nav is ever shown, so both share the name a
      // screen reader user hears. jsdom ignores CSS, so here both are present.
      expect(screen.getAllByRole('navigation', { name: 'Main' })).toHaveLength(
        2,
      )
    })

    it('lists About and Articles', async () => {
      const user = userEvent.setup()
      render(<Header />)

      await user.click(screen.getByRole('button', { name: 'Menu' }))

      // Until the navs are labelled, check across both: each page appears
      // once per nav, and Projects appears in neither.
      expect(screen.getAllByRole('link', { name: 'About' })).toHaveLength(2)
      expect(screen.getAllByRole('link', { name: 'Articles' })).toHaveLength(2)
      expect(
        screen.queryByRole('link', { name: 'Projects' }),
      ).not.toBeInTheDocument()
    })

    it('marks the link for the current page', async () => {
      const user = userEvent.setup()
      pathname.current = '/articles'
      render(<Header />)

      await user.click(screen.getByRole('button', { name: 'Menu' }))

      // With the menu open, the desktop and mobile navs are both unnamed
      // landmarks, so they can't be told apart yet. Every Articles link must
      // be marked, which means the mobile one as well as the desktop one.
      expect(
        screen.getAllByRole('link', { name: 'Articles', current: 'page' }),
      ).toHaveLength(2)
      expect(
        screen.getAllByRole('link', { name: 'About', current: false }),
      ).toHaveLength(2)
    })
  })
})
