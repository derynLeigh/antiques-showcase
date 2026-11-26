import { render, screen, within } from '@testing-library/react'
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

// Three photos, in the curator's order. Only the second has a caption.
const connie: Piece = {
  ...teaCaddy,
  slug: 'connie',
  title: "Lockheed Constellation 'Connie' shop display model",
  summary: 'A 1950s shop display model with a 22 inch wingspan.',
  made: '1950s',
  images: [
    {
      src: { src: '/connie-side.jpg', width: 100, height: 100 },
      alt: 'Silver four-engined airliner model on a stand, from the side',
    },
    {
      src: { src: '/connie-tail.jpg', width: 100, height: 100 },
      alt: "Close-up of the model airliner's triple tail fins",
      caption: 'Triple tail fins, each with its own rudder',
    },
    {
      src: { src: '/connie-stand.jpg', width: 100, height: 100 },
      alt: "The chrome stand, with the maker's plate on its base",
    },
  ],
}

// Next passes the slug from the address as a promise.
async function renderPiecePage(slug: string) {
  render(await PiecePage({ params: Promise.resolve({ slug }) }))
}

// True when later comes after earlier in the page, as a screen reader or a
// visitor scrolling down would reach them.
function comesAfter(later: Element, earlier: Element) {
  return Boolean(
    earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING,
  )
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

  // The alt text is what screen readers read out in place of each photo.
  it('shows every photo of the piece in order, described by its alt text', async () => {
    getPiece.mockResolvedValue(connie)

    await renderPiecePage('connie')

    expect(
      screen.getAllByRole('img').map((photo) => photo.getAttribute('alt')),
    ).toEqual([
      'Silver four-engined airliner model on a stand, from the side',
      "Close-up of the model airliner's triple tail fins",
      "The chrome stand, with the maker's plate on its base",
    ])
  })

  // jsdom doesn't name a figure from its caption, so each figure is checked
  // in order. A photo with no caption has no text in its figure.
  it('shows a caption with its photo when one is given', async () => {
    getPiece.mockResolvedValue(connie)

    await renderPiecePage('connie')

    const [side, tail, stand] = screen.getAllByRole('figure')
    expect(
      within(tail).getByRole('img', {
        name: "Close-up of the model airliner's triple tail fins",
      }),
    ).toBeInTheDocument()
    expect(tail).toHaveTextContent('Triple tail fins, each with its own rudder')
    expect(side).toHaveTextContent(/^$/)
    expect(stand).toHaveTextContent(/^$/)
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

  // The heading lets screen reader users jump straight to the facts.
  it('heads the key facts with the level-2 heading Key facts', async () => {
    getPiece.mockResolvedValue({ ...teaCaddy, maker: 'Hester Bateman' })

    await renderPiecePage('georgian-tea-caddy')

    expect(
      screen.getByRole('heading', { level: 2, name: 'Key facts' }),
    ).toBeInTheDocument()
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

  // teaCaddy gives none of origin, maker, materials or dimensions.
  describe('when no facts are known', () => {
    it('leaves out the key facts, heading and all', async () => {
      await renderPiecePage('georgian-tea-caddy')

      expect(
        screen.queryByRole('heading', { level: 2, name: 'Key facts' }),
      ).not.toBeInTheDocument()
      expect(screen.queryAllByRole('term')).toHaveLength(0)
    })
  })

  // The story is the MDX below the piece's details, in the curator's voice.
  it("shows the piece's story below the photos and key facts", async () => {
    getPiece.mockResolvedValue({
      ...connie,
      maker: 'Lockheed',
      Body: () => (
        <p>
          Travel agents used models like this to sell the glamour of flying.
        </p>
      ),
    })

    await renderPiecePage('connie')

    const story = screen.getByText(
      'Travel agents used models like this to sell the glamour of flying.',
    )
    const photos = screen.getAllByRole('img')
    const lastPhoto = photos[photos.length - 1]
    const keyFacts = screen.getByRole('heading', {
      level: 2,
      name: 'Key facts',
    })
    expect(comesAfter(story, lastPhoto)).toBe(true)
    expect(comesAfter(story, keyFacts)).toBe(true)
  })

  // A source with a web address links to it. One without, such as a book or
  // a conversation, is listed as plain text.
  it("lists the piece's sources below its story", async () => {
    getPiece.mockResolvedValue({
      ...connie,
      sources: [
        {
          label: 'Lockheed Martin: the Constellation',
          url: 'https://www.lockheedmartin.com/en-us/news/features/history/constellation.html',
        },
        { label: 'Conversation with a retired BOAC travel agent, 2019' },
      ],
      Body: () => <p>Travel agents used models like this.</p>,
    })

    await renderPiecePage('connie')

    const heading = screen.getByRole('heading', { level: 2, name: 'Sources' })
    expect(
      comesAfter(
        heading,
        screen.getByText('Travel agents used models like this.'),
      ),
    ).toBe(true)
    const sources = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(sources).toHaveLength(2)
    expect(
      within(sources[0]).getByRole('link', {
        name: 'Lockheed Martin: the Constellation',
      }),
    ).toHaveAttribute(
      'href',
      'https://www.lockheedmartin.com/en-us/news/features/history/constellation.html',
    )
    expect(sources[1]).toHaveTextContent(
      'Conversation with a retired BOAC travel agent, 2019',
    )
    expect(within(sources[1]).queryByRole('link')).not.toBeInTheDocument()
  })

  // teaCaddy has no sources. The schema makes a missing list an empty one.
  describe('when the piece has no sources', () => {
    it('leaves out the sources, heading and all', async () => {
      await renderPiecePage('georgian-tea-caddy')

      expect(
        screen.queryByRole('heading', { level: 2, name: 'Sources' }),
      ).not.toBeInTheDocument()
      expect(screen.queryByRole('list')).not.toBeInTheDocument()
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
