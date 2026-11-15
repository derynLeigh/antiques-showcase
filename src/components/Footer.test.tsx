import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Footer } from '@/components/Footer'

// Footer repeats the site's pages and shows the copyright line. These tests
// characterise it as it is today, including the Projects link the header has
// already dropped; that changes in a later red-green cycle.
describe('Footer', () => {
  it('lists About, Articles and Projects as links', () => {
    render(<Footer />)

    const links = within(screen.getByRole('contentinfo')).getAllByRole('link')

    expect(
      links.map((link) => [link.textContent, link.getAttribute('href')]),
    ).toEqual([
      ['About', '/about'],
      ['Articles', '/articles'],
      ['Projects', '/projects'],
    ])
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
