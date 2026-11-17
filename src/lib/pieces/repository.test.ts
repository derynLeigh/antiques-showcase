import { describe, expect, it } from 'vitest'

import type { PieceMeta } from '@/lib/piece'
import { inMemoryPieceSource } from '@/lib/pieces/in-memory-source'
import { createPieceRepository } from '@/lib/pieces/repository'
import type { RawPiece } from '@/lib/pieces/source'

// A raw piece whose metadata passes validation. Each test overrides only the
// fields it cares about, so what the test is about stays visible.
function rawPiece(slug: string, meta: Partial<PieceMeta> = {}): RawPiece {
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
      expect(message).toMatch(/^2 pieces have problems:/)
      expect(message).toMatch(/tea-caddy: images\[0\]\.alt/)
      expect(message).toMatch(/oak-coffer: made/)
      expect(message).toMatch(/oak-coffer: images/)
      expect(message).not.toMatch(/connie/)
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
