import { describe, expect, it } from 'vitest'

import type { PieceMeta } from '@/lib/piece'
import { inMemoryPieceSource } from '@/lib/pieces/in-memory-source'
import { createPieceRepository } from '@/lib/pieces/repository'
import type { RawPiece } from '@/lib/pieces/source'

// A raw piece whose metadata passes validation. Each test overrides only the
// fields it cares about, so what the test is about stays visible. Overrides
// can be any value, because a source hands over unchecked data.
function rawPiece(
  slug: string,
  meta: { [Field in keyof PieceMeta]?: unknown } = {},
): RawPiece {
  return {
    slug,
    meta: {
      title: `Piece ${slug}`,
      summary: 'A one-line summary.',
      made: 'c. 1780',
      images: [
        {
          src: { src: `/${slug}.jpg`, width: 100, height: 100 },
          alt: 'The piece photographed on a linen backdrop',
        },
      ],
      openToOffers: true,
      addedOn: '2026-11-01',
      ...meta,
    },
    Body: () => null,
  }
}

const slugs = (pieces: { slug: string }[]) => pieces.map((piece) => piece.slug)

describe('createPieceRepository', () => {
  describe('getAllPieces', () => {
    it("returns the pieces in the order the source's order list gives", async () => {
      const source = inMemoryPieceSource(
        [rawPiece('tea-caddy'), rawPiece('oak-coffer'), rawPiece('connie')],
        ['oak-coffer', 'connie', 'tea-caddy'],
      )
      const { getAllPieces } = createPieceRepository(source)

      const pieces = await getAllPieces()

      expect(slugs(pieces)).toEqual(['oak-coffer', 'connie', 'tea-caddy'])
    })

    // A new piece shouldn't vanish just because it hasn't been placed yet.
    it('puts pieces missing from the order list after the listed ones, newest addedOn first', async () => {
      const source = inMemoryPieceSource(
        [
          rawPiece('oak-coffer', { addedOn: '2026-10-01' }),
          rawPiece('tea-caddy'),
          rawPiece('connie', { addedOn: '2026-11-10' }),
        ],
        ['tea-caddy'],
      )
      const { getAllPieces } = createPieceRepository(source)

      const pieces = await getAllPieces()

      expect(slugs(pieces)).toEqual(['tea-caddy', 'connie', 'oak-coffer'])
    })

    // The key facts panel leaves out what isn't known. A blank value must
    // count as not known, or the panel would show a label with nothing after it.
    it('treats blank optional text as not given', async () => {
      const source = inMemoryPieceSource([
        rawPiece('tea-caddy', {
          origin: '',
          maker: '   ',
          materials: '\n',
          dimensions: ' \t ',
          images: [
            {
              src: { src: '/hero.jpg', width: 100, height: 100 },
              alt: 'Oval silver tea caddy with a domed lid',
              caption: '  ',
            },
          ],
        }),
      ])
      const { getAllPieces } = createPieceRepository(source)

      const [piece] = await getAllPieces()

      expect(piece.origin).toBeUndefined()
      expect(piece.maker).toBeUndefined()
      expect(piece.materials).toBeUndefined()
      expect(piece.dimensions).toBeUndefined()
      expect(piece.images[0].caption).toBeUndefined()
    })

    // A broken piece must fail the build, with a message that says which
    // piece and which field to fix.
    it('throws when a piece has no images, naming the slug and the field', async () => {
      const source = inMemoryPieceSource([
        rawPiece('tea-caddy'),
        rawPiece('oak-coffer', { images: [] }),
      ])
      const { getAllPieces } = createPieceRepository(source)

      await expect(getAllPieces()).rejects.toThrow(/oak-coffer: images/)
    })

    // Alt text is what a screen reader user hears instead of the photo. The
    // two usual mistakes are leaving it empty and leaving the file name in.
    it.each([
      ['empty', ''],
      ['only spaces', '   '],
      ['a camera file name', 'IMG_2231.jpg'],
      ['an upper-case file name', 'DSC_0042.JPG'],
    ])('throws when alt text is %s, naming the photo', async (_case, alt) => {
      const source = inMemoryPieceSource([
        rawPiece('tea-caddy', {
          images: [
            {
              src: { src: '/hero.jpg', width: 100, height: 100 },
              alt: 'Oval silver tea caddy with a domed lid',
            },
            {
              src: { src: '/hallmark.jpg', width: 100, height: 100 },
              alt,
            },
          ],
        }),
      ])
      const { getAllPieces } = createPieceRepository(source)

      await expect(getAllPieces()).rejects.toThrow(
        /tea-caddy: images\[1\]\.alt/,
      )
    })

    // Fixing pieces one build at a time would be miserable, so every problem
    // in every piece is reported together.
    it('lists every problem in every broken piece in one error', async () => {
      const source = inMemoryPieceSource([
        rawPiece('tea-caddy', {
          images: [
            {
              src: { src: '/hero.jpg', width: 100, height: 100 },
              alt: 'IMG_2231.jpg',
            },
          ],
        }),
        rawPiece('connie'),
        rawPiece('oak-coffer', { made: '', images: [] }),
      ])
      const { getAllPieces } = createPieceRepository(source)

      const error = await getAllPieces().catch((caught: unknown) => caught)

      expect(error).toBeInstanceOf(Error)
      const { message } = error as Error
      // Three problems across two pieces: the heading counts problems.
      expect(message).toMatch(/^The collection has 3 problems:/)
      expect(message).toMatch(/tea-caddy: images\[0\]\.alt/)
      expect(message).toMatch(/oak-coffer: made/)
      expect(message).toMatch(/oak-coffer: images/)
      expect(message).not.toMatch(/connie/)
    })

    it('words the heading in the singular when there is one problem', async () => {
      const source = inMemoryPieceSource([
        rawPiece('connie'),
        rawPiece('oak-coffer', { images: [] }),
      ])
      const { getAllPieces } = createPieceRepository(source)

      await expect(getAllPieces()).rejects.toThrow(
        /^The collection has 1 problem:/,
      )
    })

    it.each([
      ['missing', undefined],
      ['empty', ''],
    ])('says "made is required" when made is %s', async (_case, made) => {
      const source = inMemoryPieceSource([rawPiece('oak-coffer', { made })])
      const { getAllPieces } = createPieceRepository(source)

      await expect(getAllPieces()).rejects.toThrow(
        'oak-coffer: made is required',
      )
    })

    // Every message reads as plain English after the field name, so the
    // curator knows what to change without knowing Zod.
    const hallmarkPhoto = {
      src: { src: '/hallmark.jpg', width: 100, height: 100 },
      alt: 'Close-up of the London hallmark',
    }
    it.each<[string, Record<string, unknown>, string]>([
      ['title is missing', { title: undefined }, 'title is required'],
      ['title is empty', { title: '' }, 'title is required'],
      ['title is only spaces', { title: '   ' }, 'title is required'],
      ['summary is missing', { summary: undefined }, 'summary is required'],
      ['summary is empty', { summary: '' }, 'summary is required'],
      ['summary is only spaces', { summary: '  \n ' }, 'summary is required'],
      ['made is only spaces', { made: '   ' }, 'made is required'],
      [
        'openToOffers is missing',
        { openToOffers: undefined },
        'openToOffers must be true or false',
      ],
      [
        'openToOffers is text',
        { openToOffers: 'yes' },
        'openToOffers must be true or false',
      ],
      [
        'featured is text',
        { featured: 'yes' },
        'featured must be true or false',
      ],
      [
        'addedOn is missing',
        { addedOn: undefined },
        'addedOn must be a date like 2026-11-15',
      ],
      [
        'addedOn is written the British way',
        { addedOn: '15/11/2026' },
        'addedOn must be a date like 2026-11-15',
      ],
      ['origin is a number', { origin: 1780 }, 'origin must be text'],
      ['maker is a number', { maker: 1 }, 'maker must be text'],
      ['materials is a number', { materials: 1 }, 'materials must be text'],
      ['dimensions is a number', { dimensions: 22 }, 'dimensions must be text'],
      [
        'a caption is a number',
        { images: [{ ...hallmarkPhoto, caption: 1784 }] },
        'images[0].caption must be text',
      ],
      [
        'a photo has no alt text at all',
        { images: [{ src: hallmarkPhoto.src }] },
        'images[0].alt must describe the photo',
      ],
      [
        'a source has no label',
        { sources: [{ url: 'https://example.com' }] },
        'sources[0].label is required',
      ],
      [
        'a source label is empty',
        { sources: [{ label: '', url: 'https://example.com' }] },
        'sources[0].label is required',
      ],
      [
        'a source label is only spaces',
        { sources: [{ label: '   ', url: 'https://example.com' }] },
        'sources[0].label is required',
      ],
      [
        'a source link is not a web address',
        { sources: [{ label: 'Hallmark guide', url: 'hallmarks page' }] },
        'sources[0].url must be a full web address, like https://example.com',
      ],
      // Sources become links on the piece page. A javascript: link would run
      // script when clicked, so only http and https are allowed.
      ...[
        'javascript:alert(1)',
        'ftp://example.com/hallmarks.pdf',
        'mailto:dealer@example.com',
        'data:text/html,<p>Hallmarks</p>',
      ].map((url): [string, Record<string, unknown>, string] => [
        `a source link is ${url.split(':')[0]}:`,
        { sources: [{ label: 'Hallmark guide', url }] },
        'sources[0].url must be a full web address, like https://example.com',
      ]),
    ])(
      'explains the problem in plain English when %s',
      async (_case, meta, line) => {
        const source = inMemoryPieceSource([rawPiece('tea-caddy', meta)])
        const { getAllPieces } = createPieceRepository(source)

        await expect(getAllPieces()).rejects.toThrow(`tea-caddy: ${line}`)
      },
    )

    it.each(['http://example.com/hallmarks', 'https://example.com/hallmarks'])(
      'accepts a source link starting %s',
      async (url) => {
        const source = inMemoryPieceSource([
          rawPiece('tea-caddy', {
            sources: [{ label: 'Hallmark guide', url }],
          }),
        ])
        const { getAllPieces } = createPieceRepository(source)

        const [piece] = await getAllPieces()

        expect(piece.sources[0].url).toBe(url)
      },
    )

    // Two folders can't share a name, but a CMS source could return the same
    // slug twice, and then one piece's page would silently hide the other's.
    it('throws when two pieces share a slug, naming the slug', async () => {
      const source = inMemoryPieceSource([
        rawPiece('tea-caddy', { title: 'Georgian silver tea caddy' }),
        rawPiece('connie'),
        rawPiece('tea-caddy', { title: 'Victorian tea caddy' }),
      ])
      const { getAllPieces } = createPieceRepository(source)

      await expect(getAllPieces()).rejects.toThrow(
        'tea-caddy: slug is used by more than one piece',
      )
    })

    // Almost always a typo or a renamed folder. Left alone, the piece it was
    // meant for would quietly drop to the end of the collection.
    it('throws when the order list names a slug with no piece, naming that slug', async () => {
      const source = inMemoryPieceSource(
        [rawPiece('tea-caddy'), rawPiece('connie')],
        ['connie', 'tea-cady'],
      )
      const { getAllPieces } = createPieceRepository(source)

      await expect(getAllPieces()).rejects.toThrow(
        'tea-cady: is in the order list, but no piece has that slug',
      )
    })

    it('reports a missing slug once, however often the order list names it', async () => {
      const source = inMemoryPieceSource(
        [rawPiece('tea-caddy'), rawPiece('connie')],
        ['tea-cady', 'connie', 'tea-cady'],
      )
      const { getAllPieces } = createPieceRepository(source)

      const error = await getAllPieces().catch((caught: unknown) => caught)

      expect(error).toBeInstanceOf(Error)
      const { message } = error as Error
      expect(message).toMatch(/^The collection has 1 problem:/)
      expect(message.match(/tea-cady:/g)).toHaveLength(1)
    })
  })

  describe('getPiece', () => {
    it('returns the piece with that slug', async () => {
      const source = inMemoryPieceSource([
        rawPiece('tea-caddy', { title: 'Georgian silver tea caddy' }),
        rawPiece('connie', { title: "Lockheed Constellation 'Connie' model" }),
      ])
      const { getPiece } = createPieceRepository(source)

      const piece = await getPiece('connie')

      expect(piece).toMatchObject({
        slug: 'connie',
        title: "Lockheed Constellation 'Connie' model",
      })
    })

    // The piece page shows the not-found page when this is undefined.
    it('returns undefined for a slug that does not exist', async () => {
      const source = inMemoryPieceSource([rawPiece('tea-caddy')])
      const { getPiece } = createPieceRepository(source)

      const piece = await getPiece('no-such-piece')

      expect(piece).toBeUndefined()
    })
  })

  describe('getRecentlyAdded', () => {
    // The curator's order is deliberately different from date order, so the
    // test shows that "recently added" ignores it.
    it('returns at most the given number of pieces, newest addedOn first', async () => {
      const source = inMemoryPieceSource(
        [
          rawPiece('oak-coffer', { addedOn: '2026-07-01' }),
          rawPiece('connie', { addedOn: '2026-11-10' }),
          rawPiece('tea-caddy', { addedOn: '2026-09-15' }),
          rawPiece('pewter-tankard', { addedOn: '2026-10-01' }),
          rawPiece('brass-lantern', { addedOn: '2026-08-20' }),
        ],
        [
          'oak-coffer',
          'connie',
          'tea-caddy',
          'pewter-tankard',
          'brass-lantern',
        ],
      )
      const { getRecentlyAdded } = createPieceRepository(source)

      const pieces = await getRecentlyAdded(4)

      expect(slugs(pieces)).toEqual([
        'connie',
        'pewter-tankard',
        'tea-caddy',
        'brass-lantern',
      ])
    })
  })

  describe('getFeatured', () => {
    // The source lists the featured pieces in the opposite order to the
    // curator, so the test shows which order wins.
    it("returns only featured pieces, in the curator's order", async () => {
      const source = inMemoryPieceSource(
        [
          rawPiece('tea-caddy', { featured: true }),
          rawPiece('oak-coffer', { featured: false }),
          rawPiece('connie', { featured: true }),
          rawPiece('brass-lantern', { featured: false }),
        ],
        ['connie', 'oak-coffer', 'tea-caddy', 'brass-lantern'],
      )
      const { getFeatured } = createPieceRepository(source)

      const pieces = await getFeatured()

      expect(slugs(pieces)).toEqual(['connie', 'tea-caddy'])
    })
  })
})
