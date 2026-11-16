import type { PieceSource, RawPiece } from '@/lib/pieces/source'

// A source that returns exactly what it's given, so repository tests need no
// files.
export function inMemoryPieceSource(
  entries: RawPiece[],
  order: string[] = [],
): PieceSource {
  return {
    list: async () => entries,
    order: async () => order,
  }
}
