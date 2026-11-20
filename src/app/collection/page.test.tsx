import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import CollectionPage from '@/app/collection/page'
import type { Piece } from '@/lib/piece'

const { getAllPieces } = vi.hoisted(() => ({ getAllPieces: vi.fn() }))
vi.mock('@/lib/pieces', () => ({ getAllPieces }))

const teaCaddy: Piece = {
  slug: 'georgian-tea-caddy',
  title: 'Georgian silver tea caddy',
  summary: 'An oval silver tea caddy with a domed lid.',
  made: 'c. 1780',
  images: [
    {
      src: { src: '/hero.jpg', width: 100, height: 100 },
      alt: 'Oval silver tea caddy with a domed lid, on a linen backdrop',
    },
  ],
  openToOffers: true,
  featured: false,
  addedOn: '2026-11-10',
  sources: [],
  Body: () => <p>Tea was precious enough to keep under lock and key.</p>,
}

const connie: Piece = {
  ...teaCaddy,
  slug: 'connie',
  title: "Lockheed Constellation 'Connie' shop display model",
  summary: 'A 1950s shop display model with a 22 inch wingspan.',
  made: '1950s',
}

describe('CollectionPage', () => {
  it('has the level-1 heading The collection', async () => {
    getAllPieces.mockResolvedValue([teaCaddy, connie])

    render(await CollectionPage())

    expect(
      screen.getByRole('heading', { level: 1, name: 'The collection' }),
    ).toBeInTheDocument()
  })

  it('shows one card per piece, each linking to its page', async () => {
    getAllPieces.mockResolvedValue([teaCaddy, connie])

    render(await CollectionPage())

    const cards = screen.getAllByRole('article')
    expect(cards).toHaveLength(2)
    expect(
      within(cards[0]).getByRole('link', { name: 'Georgian silver tea caddy' }),
    ).toHaveAttribute('href', '/collection/georgian-tea-caddy')
    expect(
      within(cards[1]).getByRole('link', {
        name: "Lockheed Constellation 'Connie' shop display model",
      }),
    ).toHaveAttribute('href', '/collection/connie')
  })

  // made is shown as written, as on the piece page.
  it("shows each piece's summary and when it was made", async () => {
    getAllPieces.mockResolvedValue([teaCaddy, connie])

    render(await CollectionPage())

    const [teaCaddyCard, connieCard] = screen.getAllByRole('article')
    expect(
      within(teaCaddyCard).getByText(
        'An oval silver tea caddy with a domed lid.',
      ),
    ).toBeInTheDocument()
    expect(within(teaCaddyCard).getByText('c. 1780')).toBeInTheDocument()
    expect(
      within(connieCard).getByText(
        'A 1950s shop display model with a 22 inch wingspan.',
      ),
    ).toBeInTheDocument()
    expect(within(connieCard).getByText('1950s')).toBeInTheDocument()
  })
})
