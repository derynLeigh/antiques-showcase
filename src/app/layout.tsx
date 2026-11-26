import { type Metadata } from 'next'

import { Providers } from '@/app/providers'
import { Layout } from '@/components/Layout'
import { siteUrl } from '@/lib/site'

import '@/styles/tailwind.css'

export const metadata: Metadata = {
  // Turns relative URLs in link previews, such as a piece's photo, into full
  // ones on the site's own address.
  metadataBase: siteUrl(),
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
