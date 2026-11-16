import type { Piece } from '@/lib/piece'
import type { PieceSource } from '@/lib/pieces/source'

export function createPieceRepository(source: PieceSource) {
  return {
    async getAllPieces(): Promise<Piece[]> {
      return []
    },
  }
}
