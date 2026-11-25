import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import PiecePage, {
  dynamicParams,
  generateMetadata,
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

  // Each label is a term and each value its definition, so checking both
  // lists in order pairs every label with its value. Values are free text,
  // shown as written.
  it('shows each known fact with its label, exactly as written', async () => {
    getPiece.mockResolvedValue({
      ...teaCaddy,
      origin: 'London, England',
      maker: 'Hester Bateman',
      materials: 'Sterling silver, with an ivory finial',
      dimensions: '5¼ in high, 4 in wide',
    })

    await renderPiecePage('georgian-tea-caddy')

    expect(screen.getAllByRole('term').map((term) => term.textContent)).toEqual(
      ['Origin', 'Maker', 'Materials', 'Dimensions'],
    )
    expect(
      screen.getAllByRole('definition').map((value) => value.textContent),
    ).toEqual([
      'London, England',
      'Hester Bateman',
      'Sterling silver, with an ivory finial',
      '5¼ in high, 4 in wide',
    ])
  })

  // The schema turns blank text into not given, so a fact left blank in the
  // piece's file is left out here too.
  describe("when a fact isn't known", () => {
    it('leaves out its label and value', async () => {
      getPiece.mockResolvedValue({
        ...teaCaddy,
        origin: 'London, England',
        materials: 'Sterling silver, with an ivory finial',
        dimensions: '5¼ in high, 4 in wide',
      })

      await renderPiecePage('georgian-tea-caddy')

      expect(
        screen.getAllByRole('term').map((term) => term.textContent),
      ).toEqual(['Origin', 'Materials', 'Dimensions'])
      expect(
        screen.getAllByRole('definition').map((value) => value.textContent),
      ).toEqual([
        'London, England',
        'Sterling silver, with an ivory finial',
        '5¼ in high, 4 in wide',
      ])
    })
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

// The root layout's title template adds the site name, so a tab reads
// "Georgian silver tea caddy - Site Name". The summary is the description
// search results and link previews show.
describe('generateMetadata', () => {
  it("uses the piece's title and summary", async () => {
    getPiece.mockResolvedValue({
      ...teaCaddy,
      slug: 'connie',
      title: "Lockheed Constellation 'Connie' shop display model",
      summary: 'A 1950s shop display model with a 22 inch wingspan.',
    })

    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: 'connie' }),
    })

    expect(getPiece).toHaveBeenCalledWith('connie')
    expect(metadata).toMatchObject({
      title: "Lockheed Constellation 'Connie' shop display model",
      description: 'A 1950s shop display model with a 22 inch wingspan.',
    })
  })

  // Next doesn't copy title and description into Open Graph or Twitter, and
  // without a card type X shows a bare link. The preview photo comes with
  // BOB-24.
  it("gives link previews the piece's title and summary", async () => {
    getPiece.mockResolvedValue(teaCaddy)

    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: 'georgian-tea-caddy' }),
    })

    expect(metadata).toMatchObject({
      openGraph: {
        type: 'article',
        title: 'Georgian silver tea caddy',
        description: 'An oval silver tea caddy with a domed lid.',
      },
      twitter: {
        card: 'summary',
        title: 'Georgian silver tea caddy',
        description: 'An oval silver tea caddy with a domed lid.',
      },
    })
  })
})
