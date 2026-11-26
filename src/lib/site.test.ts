import { afterEach, describe, expect, it, vi } from 'vitest'

import { siteUrl } from '@/lib/site'

// CI sets NEXT_PUBLIC_SITE_URL for every test, so each test sets both
// settings itself. An empty setting counts as not set, as Vercel can leave one
// empty.
function settings(site: string, vercelProduction: string) {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', site)
  vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', vercelProduction)
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('siteUrl', () => {
  // The site's own domain, once it has one, wins over Vercel's address.
  describe('when NEXT_PUBLIC_SITE_URL is set', () => {
    it('returns that address', () => {
      settings('https://example.com', 'antiques-showcase.vercel.app')

      expect(siteUrl()).toEqual(new URL('https://example.com'))
    })
  })

  // localhost:3000 and ftp://example.com are valid URLs, but not web
  // addresses: the first reads as the scheme localhost: with no host.
  describe("when NEXT_PUBLIC_SITE_URL isn't a full web address", () => {
    it.each(['example.com', 'localhost:3000', 'ftp://example.com'])(
      'stops with an error naming the setting (%s)',
      (address) => {
        settings(address, '')

        expect(() => siteUrl()).toThrow(
          `NEXT_PUBLIC_SITE_URL isn't a full web address: ${address}`,
        )
      },
    )
  })

  // Vercel sets its production address, without https://, on every build.
  describe('when only the Vercel production address is set', () => {
    it('returns it as an https address', () => {
      settings('', 'antiques-showcase.vercel.app')

      expect(siteUrl()).toEqual(new URL('https://antiques-showcase.vercel.app'))
    })
  })

  // Next's own default when nothing says where the site lives.
  describe('when neither is set', () => {
    it('returns the local development address', () => {
      settings('', '')

      expect(siteUrl()).toEqual(new URL('http://localhost:3000'))
    })
  })
})
