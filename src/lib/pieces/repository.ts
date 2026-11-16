import type { Piece, PieceMeta } from '@/lib/piece'
import type { PieceSource } from '@/lib/pieces/source'

export function createPieceRepository(source: PieceSource) {
  async function getAllPieces(): Promise<Piece[]> {
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
  }

  // Goes through getAllPieces so every lookup gets the same checks.
  async function getPiece(slug: string): Promise<Piece | undefined> {
    const pieces = await getAllPieces()
    return pieces.find((piece) => piece.slug === slug)
  }

  // Ignores the curator's order: "recently added" is about when, not where.
  async function getRecentlyAdded(limit: number): Promise<Piece[]> {
    const pieces = await getAllPieces()
    return pieces
      .toSorted((a, b) => b.addedOn.localeCompare(a.addedOn))
      .slice(0, limit)
  }

  return { getAllPieces, getPiece, getRecentlyAdded }
}
