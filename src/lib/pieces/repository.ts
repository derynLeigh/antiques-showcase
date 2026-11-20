import type { Piece } from '@/lib/piece'
import type { PieceSource } from '@/lib/pieces/source'
import { validate } from '@/lib/pieces/validate'

// Sorts pieces newest addedOn first. addedOn is an ISO date (2026-11-10), so
// comparing the strings compares the dates.
function newestFirst(a: Piece, b: Piece) {
  return b.addedOn.localeCompare(a.addedOn)
}

// Listed pieces come first, in the curator's order. Pieces not yet placed
// follow, newest first.
function inCuratorOrder(pieces: Piece[], order: string[]): Piece[] {
  const listed = pieces
    .filter((piece) => order.includes(piece.slug))
    .toSorted((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug))
  const unplaced = pieces
    .filter((piece) => !order.includes(piece.slug))
    .toSorted(newestFirst)

  return [...listed, ...unplaced]
}

interface PieceRepositoryOptions {
  // Keep the first checked result and return it for every later lookup. For
  // builds, where each page would otherwise check the whole collection again.
  // Leave it off in next dev, so an edited piece shows on the next page load.
  reuse?: boolean
}

export function createPieceRepository(
  source: PieceSource,
  { reuse = false }: PieceRepositoryOptions = {},
) {
  async function readAndCheck(): Promise<Piece[]> {
    const [raws, order] = await Promise.all([source.list(), source.order()])
    return inCuratorOrder(validate(raws, order), order)
  }

  // The promise itself is kept, so lookups made at the same time share one
  // read, and a collection with problems keeps failing with the same error.
  let kept: Promise<Piece[]> | undefined

  function getAllPieces(): Promise<Piece[]> {
    if (!reuse) return readAndCheck()
    kept ??= readAndCheck()
    return kept
  }

  // Goes through getAllPieces so every lookup gets the same checks.
  async function getPiece(slug: string): Promise<Piece | undefined> {
    const pieces = await getAllPieces()
    return pieces.find((piece) => piece.slug === slug)
  }

  // Ignores the curator's order: "recently added" is about when, not where.
  async function getRecentlyAdded(limit: number): Promise<Piece[]> {
    const pieces = await getAllPieces()
    return pieces.toSorted(newestFirst).slice(0, limit)
  }

  // Keeps getAllPieces' order, so featured pieces appear as the curator placed
  // them.
  async function getFeatured(): Promise<Piece[]> {
    const pieces = await getAllPieces()
    return pieces.filter((piece) => piece.featured)
  }

  return { getAllPieces, getPiece, getRecentlyAdded, getFeatured }
}
