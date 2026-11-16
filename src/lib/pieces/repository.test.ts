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
})
