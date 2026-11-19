import { order } from '@/content/pieces/order'
import { createMdxPieceSource } from '@/lib/pieces/mdx-source'
import { createPieceRepository } from '@/lib/pieces/repository'

// What pages import. Pieces live in src/content/pieces/<slug>/index.mdx, with
// their photos beside them. Swapping to a CMS later means changing only the
// source here.
const source = createMdxPieceSource({
  folder: 'src/content/pieces',
  importPiece: (slug) => import(`../../content/pieces/${slug}/index.mdx`),
  order,
})

export const { getAllPieces, getPiece, getRecentlyAdded, getFeatured } =
  createPieceRepository(source)
