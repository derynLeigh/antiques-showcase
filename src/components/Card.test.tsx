import { isInaccessible, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Card } from '@/components/Card'

// Card is the building block of the collection gallery: each piece becomes a
// card whose title links to the piece page. What matters is the semantics a
// visitor or screen reader gets: the landmark element, the heading, a single
// link named by the title, and the "Read article" prompt staying silent.
// Hover and overlay styling is deliberately not tested.
describe('Card', () => {
  it('renders as the element passed in `as`', () => {
    render(
      <Card as="article">
        <Card.Title>Georgian mahogany bureau</Card.Title>
      </Card>,
    )

    expect(screen.getByRole('article')).toHaveTextContent(
      'Georgian mahogany bureau',
    )
  })

  it('renders as a list item inside a list', () => {
    render(
      <ul>
        <Card as="li">
          <Card.Title>Georgian mahogany bureau</Card.Title>
        </Card>
      </ul>,
    )

    expect(screen.getByRole('listitem')).toHaveTextContent(
      'Georgian mahogany bureau',
    )
  })

  it('gives the whole card a single link named by its title alone', () => {
    render(
      <Card as="article">
        <Card.Title href="/collection/bureau">
          Georgian mahogany bureau
        </Card.Title>
        <Card.Eyebrow as="time" dateTime="2026-01-01" decorate>
          1 January 2026
        </Card.Eyebrow>
        <Card.Description>A slant-front bureau, c. 1780.</Card.Description>
        <Card.Cta>Read article</Card.Cta>
      </Card>,
    )

    const link = screen.getByRole('link')

    expect(link).toHaveAccessibleName('Georgian mahogany bureau')
    expect(link).toHaveAttribute('href', '/collection/bureau')
  })

  describe('Card.Title', () => {
    describe('with an href', () => {
      it('renders a heading containing a link to that href', () => {
        render(
          <Card.Title href="/collection/bureau">
            Georgian mahogany bureau
          </Card.Title>,
        )

        const heading = screen.getByRole('heading', {
          level: 2,
          name: 'Georgian mahogany bureau',
        })

        expect(
          within(heading).getByRole('link', {
            name: 'Georgian mahogany bureau',
          }),
        ).toHaveAttribute('href', '/collection/bureau')
      })
    })

    describe('without an href', () => {
      it('renders a plain heading with no link', () => {
        render(<Card.Title>Georgian mahogany bureau</Card.Title>)

        expect(
          screen.getByRole('heading', {
            level: 2,
            name: 'Georgian mahogany bureau',
          }),
        ).toBeInTheDocument()
        expect(screen.queryByRole('link')).not.toBeInTheDocument()
      })
    })

    it('renders the heading level passed in `as`', () => {
      render(<Card.Title as="h3">Georgian mahogany bureau</Card.Title>)

      expect(
        screen.getByRole('heading', {
          level: 3,
          name: 'Georgian mahogany bureau',
        }),
      ).toBeInTheDocument()
    })
  })

  describe('Card.Cta', () => {
    it('is hidden from assistive technology', () => {
      render(<Card.Cta>Read article</Card.Cta>)

      expect(isInaccessible(screen.getByText('Read article'))).toBe(true)
    })
  })

  describe('Card.Eyebrow', () => {
    describe('as a time element', () => {
      it('keeps its machine-readable dateTime', () => {
        render(
          <Card.Eyebrow as="time" dateTime="2026-01-01">
            1 January 2026
          </Card.Eyebrow>,
        )

        expect(screen.getByRole('time')).toHaveAttribute(
          'datetime',
          '2026-01-01',
        )
      })
    })
  })
})
