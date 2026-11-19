import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { createMdxPieceSource } from '@/lib/pieces/mdx-source'

// Reads the fixtures rather than the real content, so editing a real piece
// never breaks a test.
const source = createMdxPieceSource({
  folder: 'src/lib/pieces/__fixtures__',
  importPiece: (slug) => import(`./__fixtures__/${slug}/index.mdx`),
})

describe('createMdxPieceSource', () => {
  describe('list', () => {
    it('returns one raw piece per folder, each slug taken from its folder name', async () => {
      const raws = await source.list()

      expect(raws.map((raw) => raw.slug).toSorted()).toEqual([
        'connie',
        'georgian-tea-caddy',
      ])
    })

    // meta is checked later, by the repository, so here it only has to be the
    // file's piece export, passed through unchanged.
    it("returns each piece's metadata and its story as a component", async () => {
      const raws = await source.list()
      const [connie] = raws.filter((raw) => raw.slug === 'connie')

      expect(connie.meta).toMatchObject({
        title: "Lockheed Constellation 'Connie' shop display model",
        made: '1950s',
      })
      const { Body } = connie
      render(<Body />)
      expect(screen.getByText(/sell the glamour of flying/)).toBeInTheDocument()
    })
  })
})
