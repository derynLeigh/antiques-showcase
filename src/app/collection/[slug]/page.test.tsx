import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import PiecePage, {
  dynamicParams,
  generateStaticParams,
} from '@/app/collection/[slug]/page'
import type { Piece } from '@/lib/piece'

const { getAllPieces, getPiece, notFound } = vi.hoisted(() => ({
  getAllPieces: vi.fn(),
  getPiece: vi.fn(),
  // Next's notFound() throws to stop rendering and show the 404 page.
  notFound: vi.fn(() => {
    throw new Error('notFound')
  }),
}))
vi.mock('@/lib/pieces', () => ({ getAllPieces, getPiece }))
vi.mock('next/navigation', () => ({ notFound }))

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

// Next passes the slug from the address as a promise.
async function renderPiecePage(slug: string) {
  render(await PiecePage({ params: Promise.resolve({ slug }) }))
}

describe('PiecePage', () => {
  beforeEach(() => {
    getPiece.mockResolvedValue(teaCaddy)
  })

  it('shows the title as the level-1 heading', async () => {
    await renderPiecePage('georgian-tea-caddy')

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Georgian silver tea caddy',
      }),
    ).toBeInTheDocument()
  })

  // Antique dates are rarely exact, so made is shown as written, never
  // reformatted.
  it('shows when it was made exactly as written', async () => {
    await renderPiecePage('georgian-tea-caddy')

    expect(screen.getByText('c. 1780')).toBeInTheDocument()
  })

  describe('when no piece has that slug', () => {
    it('shows the not-found page', async () => {
      getPiece.mockResolvedValue(undefined)

      await expect(
        PiecePage({ params: Promise.resolve({ slug: 'no-such-piece' }) }),
      ).rejects.toThrow('notFound')
      expect(getPiece).toHaveBeenCalledWith('no-such-piece')
      expect(notFound).toHaveBeenCalled()
    })
  })
})

// Next calls this at build time and builds one page per slug. Building every
// piece is also what makes a broken piece fail the build.
describe('generateStaticParams', () => {
  it('returns the slug of every piece', async () => {
    getAllPieces.mockResolvedValue([teaCaddy, { ...teaCaddy, slug: 'connie' }])

    expect(await generateStaticParams()).toEqual([
      { slug: 'georgian-tea-caddy' },
      { slug: 'connie' },
    ])
  })
})

// Next's default renders an unknown slug on demand, which would read the
// content folder on the server at request time. Turned off, an address that
// wasn't built is a 404 straight away.
describe('dynamicParams', () => {
  it('is false, so only pieces built ahead of time have pages', () => {
    expect(dynamicParams).toBe(false)
  })
})
