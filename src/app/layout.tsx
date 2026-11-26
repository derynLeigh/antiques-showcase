import { type Metadata } from 'next'

import { Providers } from '@/app/providers'
import { Layout } from '@/components/Layout'
import { siteUrl } from '@/lib/site'

import '@/styles/tailwind.css'

const allowIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true'

export const metadata: Metadata = {
  // Turns relative URLs in link previews, such as a piece's photo, into full
  // ones on the site's own address.
  metadataBase: siteUrl(),
  // Search engines are asked not to list the site until launch, so its
  // placeholder pages stay out of search results. At launch, set
  // NEXT_PUBLIC_ALLOW_INDEXING to true in Vercel's Production settings.
  robots: allowIndexing
    ? { index: true, follow: true }
    : { index: false, follow: false },
  title: {
    template: '%s - Site Name',
    default: 'Site Name - Placeholder tagline',
  },
  description: 'Placeholder site description.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex h-full bg-zinc-50 dark:bg-black">
        <Providers>
          <div className="flex w-full">
            <Layout>{children}</Layout>
          </div>
        </Providers>
      </body>
    </html>
  )
}
