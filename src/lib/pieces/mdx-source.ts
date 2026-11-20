import path from 'node:path'

import glob from 'fast-glob'

import type { PieceSource, RawPiece } from '@/lib/pieces/source'

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
  // Slugs in the curator's order, from the folder's order.ts.
  order: string[]
}

// Each piece is a folder holding index.mdx and its photos. The folder name is
// the slug, chosen by hand so links keep working when a title changes.
export function createMdxPieceSource({
  folder,
  importPiece,
  order,
}: MdxPieceSourceOptions): PieceSource {
  async function list(): Promise<RawPiece[]> {
    // Folders starting with _ (such as _template) are starting points to copy,
    // not pieces.
    const files = await glob('*/index.mdx', { cwd: folder, ignore: ['_*/**'] })
    const slugs = files.map((file) => path.dirname(file))

    return Promise.all(
      slugs.map(async (slug) => {
        const { piece, default: Body } = await importPiece(slug)
        return { slug, meta: piece, Body }
      }),
    )
  }

  return {
    list,
    order: async () => order,
  }
}
