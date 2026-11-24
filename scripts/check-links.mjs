// Checks that every link from one prebuilt page to another leads to a page
// that was built. Run by smoke-build.sh after a build:
//
//   node scripts/check-links.mjs .next/server/app
//
// Each link is resolved the way a browser would, against the address of the
// page it's on, so "articles", "./articles" and "../articles" are checked as
// well as "/articles". Anchors and query strings are ignored, and so are links
// to other sites, other schemes (mailto:, tel:) and Next's own files (/_next/).
// Prints each broken link with the page it's on, and exits 1 if there are any.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

const app = process.argv[2]
if (!app) {
  console.error('Usage: node scripts/check-links.mjs <built app folder>')
  process.exit(2)
}

// Any origin will do: it only gives relative links something to resolve
// against, and tells this site's links apart from other sites'.
const site = 'https://site.invalid'

// The address a built page is served at: index.html is /, about.html is
// /about, collection/connie.html is /collection/connie.
function addressOf(file) {
  const route = file
    .replace(/\.html$/, '')
    .split(path.sep)
    .join('/')
  return route === 'index' ? '/' : `/${route}`
}

// The built page for an address, the other way round.
function fileFor(pathname) {
  const route = decodeURIComponent(pathname).replace(/\/+$/, '')
  return path.join(app, `${route || '/index'}.html`)
}

// Attribute values in HTML can hold entities, such as &amp; between query
// parameters.
function decodeEntities(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

// Reads each <a> tag's attributes one by one, keeping quoted values whole, so
// text such as title="see href=/about" is never mistaken for the link, and a >
// inside a quoted value doesn't end the tag. When a tag has href twice, the
// first one counts, as in a browser.
function hrefsIn(html) {
  const anchors = html.match(/<a\s(?:[^>"']|"[^"]*"|'[^']*')*>/gi) ?? []
  return anchors.flatMap((anchor) => {
    const attributes = [
      ...anchor
        .slice(2, -1)
        .matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g),
    ]
    const href = attributes.find(
      (attribute) => attribute[1].toLowerCase() === 'href',
    )
    return href ? [decodeEntities(href[2] ?? href[3] ?? href[4] ?? '')] : []
  })
}

const pages = readdirSync(app, { recursive: true })
  .filter((file) => file.endsWith('.html'))
  .sort()

const broken = new Set()
for (const page of pages) {
  const from = addressOf(page)
  const html = readFileSync(path.join(app, page), 'utf8')

  for (const href of hrefsIn(html)) {
    let url
    try {
      url = new URL(href, site + from)
    } catch {
      broken.add(`  ${from} has a link that isn't a valid address: ${href}`)
      continue
    }

    if (url.origin !== site) continue // another site, or mailto:, tel: and so on
    if (url.pathname.startsWith('/_next/')) continue

    if (!existsSync(fileFor(url.pathname))) {
      broken.add(`  ${from} links to ${url.pathname} (written as ${href})`)
    }
  }
}

if (broken.size > 0) {
  console.error(`Links to pages that weren't built:\n${[...broken].join('\n')}`)
  process.exit(1)
}
