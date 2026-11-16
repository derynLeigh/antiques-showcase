import type { Piece, PieceMeta } from '@/lib/piece'
import type { PieceSource } from '@/lib/pieces/source'

export function createPieceRepository(source: PieceSource) {
  return {
    async getAllPieces(): Promise<Piece[]> {
      const [raws, order] = await Promise.all([source.list(), source.order()])

      // Not validated yet: tests 7 to 11 drive checking meta against the schema.
      const pieces = raws.map(({ slug, meta, Body }) => ({
        ...(meta as PieceMeta),
        slug,
        Body,
      }))

      // Listed pieces come first, in the curator's order. Pieces not yet
      // placed follow, newest first. addedOn is an ISO date, so comparing the
      // strings compares the dates.
      const listed = pieces
        .filter((piece) => order.includes(piece.slug))
        .toSorted((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug))
      const unplaced = pieces
        .filter((piece) => !order.includes(piece.slug))
        .toSorted((a, b) => b.addedOn.localeCompare(a.addedOn))

      return [...listed, ...unplaced]
    },

    async getPiece(slug: string): Promise<Piece | undefined> {
      return undefined
    },
  }
}
