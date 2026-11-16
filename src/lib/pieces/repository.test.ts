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
  })
})
