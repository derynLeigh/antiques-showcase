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

      const position = (piece: Piece) => order.indexOf(piece.slug)
      return pieces.toSorted((a, b) => position(a) - position(b))
    },
  }
}
