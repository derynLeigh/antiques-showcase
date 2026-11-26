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
    if (isWebAddress(configured)) return new URL(configured)
    // The same wording as scripts/check-links.mjs.
    throw new Error(
      `NEXT_PUBLIC_SITE_URL isn't a full web address: ${configured}`,
    )
  }

  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercelProduction) return new URL(`https://${vercelProduction}`)

  return new URL('http://localhost:3000')
}

// new URL() also accepts addresses that aren't web addresses, such as
// localhost:3000 (read as the scheme localhost:) and ftp://example.com.
function isWebAddress(address: string) {
  const protocol = URL.parse(address)?.protocol
  return protocol === 'https:' || protocol === 'http:'
}
