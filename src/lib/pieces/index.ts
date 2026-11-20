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

// In a production build, every page is built ahead of time and nothing reads
// pieces afterwards, so the first checked result is reused for every page.
const repository = createPieceRepository(source, {
  reuse: process.env.NODE_ENV === 'production',
})

// In next dev, each call reads and checks every piece, so an edited piece shows
// up on the next page load. cache() shares one result per page render, so
// generateMetadata and the page read the pieces once between them.
export const getAllPieces = cache(repository.getAllPieces)
export const getPiece = cache(repository.getPiece)
export const getRecentlyAdded = cache(repository.getRecentlyAdded)
export const getFeatured = cache(repository.getFeatured)
