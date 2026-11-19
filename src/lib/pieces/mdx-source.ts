import type { PieceSource } from '@/lib/pieces/source'

// What a piece's index.mdx gives when imported: its metadata export and the
// story as a component.
export interface PieceModule {
  piece: unknown
  default: React.ComponentType
}

interface MdxPieceSourceOptions {
  // Where the piece folders are, relative to the project root.
  folder: string
  // Imports one piece's index.mdx. The caller writes the import() with a fixed
  // path and only the slug varying, such as
  //   (slug) => import(`../../content/pieces/${slug}/index.mdx`)
  // because the bundler can only include files from a path it can see.
  importPiece: (slug: string) => Promise<PieceModule>
}

export function createMdxPieceSource(
  _options: MdxPieceSourceOptions,
): PieceSource {
  return {
    list: async () => [],
    order: async () => [],
  }
}
