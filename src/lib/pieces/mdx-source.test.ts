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
  })
})
