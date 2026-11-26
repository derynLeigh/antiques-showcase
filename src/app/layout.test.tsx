import { afterEach, describe, expect, it, vi } from 'vitest'

// The layout's metadata is worked out when the module loads, so each test sets
// the settings first and then loads a fresh copy.
async function loadMetadata() {
  vi.resetModules()
  const { metadata } = await import('@/app/layout')
  return metadata
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('metadata', () => {
  // Next uses metadataBase to turn relative URLs in link previews (such as a
  // piece's photo) into full ones.
  it("gives link previews the site's address", async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://antiques.example.org')

    const metadata = await loadMetadata()

    expect(metadata.metadataBase).toEqual(
      new URL('https://antiques.example.org'),
    )
  })

  // Until launch, search engines are asked not to list the site, so its
  // placeholder pages don't appear in search results. At launch,
  // NEXT_PUBLIC_ALLOW_INDEXING is set to true in Vercel's Production settings.
  describe("when NEXT_PUBLIC_ALLOW_INDEXING isn't true", () => {
    it('asks search engines not to list the site or follow its links', async () => {
      vi.stubEnv('NEXT_PUBLIC_ALLOW_INDEXING', '')

      const metadata = await loadMetadata()

      expect(metadata.robots).toEqual({ index: false, follow: false })
    })

    // Only the exact word true lets search engines in, so a setting of false
    // can't let them in by mistake.
    it('still asks them not to when it is false', async () => {
      vi.stubEnv('NEXT_PUBLIC_ALLOW_INDEXING', 'false')

      const metadata = await loadMetadata()

      expect(metadata.robots).toEqual({ index: false, follow: false })
    })
  })

  describe('when NEXT_PUBLIC_ALLOW_INDEXING is true', () => {
    it('lets search engines list the site and follow its links', async () => {
      vi.stubEnv('NEXT_PUBLIC_ALLOW_INDEXING', 'true')

      const metadata = await loadMetadata()

      expect(metadata.robots).toEqual({ index: true, follow: true })
    })
  })
})
