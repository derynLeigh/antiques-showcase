import { pieceMeta, type Piece } from '@/lib/piece'
import type { PieceSource } from '@/lib/pieces/source'

// Sorts pieces newest addedOn first. addedOn is an ISO date (2026-11-10), so
// comparing the strings compares the dates.
function newestFirst(a: Piece, b: Piece) {
  return b.addedOn.localeCompare(a.addedOn)
}

// Writes a field path the way it would appear in code, such as images[1].alt,
// so the error points straight at the place to fix.
function formatPath(path: PropertyKey[]) {
  return path.reduce<string>((text, key) => {
    if (typeof key === 'number') return `${text}[${key}]`
    return text ? `${text}.${String(key)}` : String(key)
  }, '')
}

export function createPieceRepository(source: PieceSource) {
  async function getAllPieces(): Promise<Piece[]> {
    const [raws, order] = await Promise.all([source.list(), source.order()])

    // Nothing from a source is trusted until it matches the schema. Parsing
    // also fills in defaults, such as featured: false. Every problem in every
    // piece is collected, so one build reports everything there is to fix.
    const pieces: Piece[] = []
    const problems: string[] = []
    let brokenPieces = 0

    for (const { slug, meta, Body } of raws) {
      const result = pieceMeta.safeParse(meta)
      if (result.success) {
        pieces.push({ ...result.data, slug, Body })
      } else {
        brokenPieces++
        for (const issue of result.error.issues) {
          problems.push(
            `  ${slug}: ${formatPath(issue.path)}: ${issue.message}`,
          )
        }
      }
    }

    if (brokenPieces > 0) {
      throw new Error(
        `${brokenPieces} pieces have problems:\n${problems.join('\n')}`,
      )
    }

    // Listed pieces come first, in the curator's order. Pieces not yet
    // placed follow, newest first.
    const listed = pieces
      .filter((piece) => order.includes(piece.slug))
      .toSorted((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug))
    const unplaced = pieces
      .filter((piece) => !order.includes(piece.slug))
      .toSorted(newestFirst)

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
