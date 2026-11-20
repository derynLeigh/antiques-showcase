import { cache } from 'react'

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

const repository = createPieceRepository(source)

// Each call reads and checks every piece. cache() shares one result per page
// render, so generateMetadata and the page read the pieces once between them.
// It lasts only for that render, so an edited piece shows up straight away in
// next dev.
export const getAllPieces = cache(repository.getAllPieces)
export const getPiece = cache(repository.getPiece)
export const getRecentlyAdded = cache(repository.getRecentlyAdded)
export const getFeatured = cache(repository.getFeatured)
