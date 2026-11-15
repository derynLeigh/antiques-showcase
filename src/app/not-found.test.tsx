import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import NotFound from '@/app/not-found'

// Shown for any address that doesn't match a page. What matters is that the
// visitor is told plainly and given a way back.
describe('NotFound', () => {
  it('shows "Page not found" as the level-1 heading', () => {
    render(<NotFound />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Page not found' }),
    ).toBeInTheDocument()
  })

  it('links back to the home page', () => {
    render(<NotFound />)

    expect(screen.getByRole('link', { name: 'Go back home' })).toHaveAttribute(
      'href',
      '/',
    )
  })
})
