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
})
