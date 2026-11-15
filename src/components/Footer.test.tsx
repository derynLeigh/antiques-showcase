import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Footer } from '@/components/Footer'

// Footer repeats the site's pages and shows the copyright line. It lists the
// same pages as the header, so Projects is gone from both.
describe('Footer', () => {
  it('lists About and Articles as links', () => {
    render(<Footer />)

    const links = within(screen.getByRole('contentinfo')).getAllByRole('link')

    expect(
      links.map((link) => [link.textContent, link.getAttribute('href')]),
    ).toEqual([
      ['About', '/about'],
      ['Articles', '/articles'],
    ])
  })

  // The header's nav is called "Main" and is on the same page, so this one
  // needs a different name for screen reader users to tell them apart.
  it('puts its links, but not the copyright line, in a navigation landmark labelled Footer', () => {
    render(<Footer />)

    const nav = within(screen.getByRole('contentinfo')).getByRole(
      'navigation',
      { name: 'Footer' },
    )

    expect(within(nav).getAllByRole('link')).toHaveLength(2)
    expect(within(nav).queryByText(/©/)).not.toBeInTheDocument()
  })

  describe('copyright line', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] })
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('shows the current year and the site name', () => {
      vi.setSystemTime(new Date('2031-06-15'))
      render(<Footer />)

      expect(
        within(screen.getByRole('contentinfo')).getByText(
          '© 2031 Site Name. All rights reserved.',
        ),
      ).toBeInTheDocument()
    })
  })
})
