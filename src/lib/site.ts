// The site's own address, used to turn relative links in link previews into
// full ones. In order:
//   1. NEXT_PUBLIC_SITE_URL: the site's domain, once it has one (and CI's
//      https://example.com)
//   2. Vercel's production address, which Vercel sets on every build without
//      https://, such as antiques-showcase.vercel.app
//   3. http://localhost:3000, Next's own default, for local development
// An empty setting counts as not set.
export function siteUrl(): URL {
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  if (configured) {
    try {
      return new URL(configured)
    } catch {
      // The same wording as scripts/check-links.mjs.
      throw new Error(
        `NEXT_PUBLIC_SITE_URL isn't a full web address: ${configured}`,
      )
    }
  }

  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercelProduction) return new URL(`https://${vercelProduction}`)

  return new URL('http://localhost:3000')
}
