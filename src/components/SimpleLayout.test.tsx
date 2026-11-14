import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SimpleLayout } from '@/components/SimpleLayout'

// SimpleLayout frames the collection, projects and thank-you pages. What
// matters is that each page gets exactly one level-1 heading and its intro.
// Spacing and typography are deliberately not tested.
describe('SimpleLayout', () => {
  it('shows the title as the level-1 heading', () => {
    render(
      <SimpleLayout title="The collection" intro="Pieces we have for sale." />,
    )

    expect(
      screen.getByRole('heading', { level: 1, name: 'The collection' }),
    ).toBeInTheDocument()
  })

  it('shows the intro text', () => {
    render(
      <SimpleLayout title="The collection" intro="Pieces we have for sale." />,
    )

    expect(screen.getByText('Pieces we have for sale.')).toBeInTheDocument()
  })

  describe('with children', () => {
    it('renders them after the title and intro', () => {
      render(
        <SimpleLayout title="The collection" intro="Pieces we have for sale.">
          <ul aria-label="Pieces">
            <li>Georgian mahogany bureau</li>
          </ul>
        </SimpleLayout>,
      )

      const heading = screen.getByRole('heading', { level: 1 })
      const intro = screen.getByText('Pieces we have for sale.')
      const list = screen.getByRole('list', { name: 'Pieces' })

      expect(list).toHaveTextContent('Georgian mahogany bureau')
      expect(heading.compareDocumentPosition(list)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      )
      expect(intro.compareDocumentPosition(list)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      )
    })
  })
})
