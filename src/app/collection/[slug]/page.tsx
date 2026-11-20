import { type Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Container } from '@/components/Container'
import { getAllPieces, getPiece } from '@/lib/pieces'

export const dynamicParams = false

// One page per piece, built ahead of time. Building them all reads every
// piece, so a broken one fails the build rather than reaching the site.
export async function generateStaticParams() {
  const pieces = await getAllPieces()
  return pieces.map(({ slug }) => ({ slug }))
}

// The tab title (with the site name added by the root layout) and the
// description shown in search results and link previews.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const piece = await getPiece(slug)
  if (!piece) notFound()

  return { title: piece.title, description: piece.summary }
}

export default async function PiecePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const piece = await getPiece(slug)
  if (!piece) notFound()

  return (
    <Container className="mt-16 lg:mt-32">
      <article className="mx-auto max-w-2xl">
        <header className="flex flex-col">
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-zinc-800 sm:text-5xl dark:text-zinc-100">
            {piece.title}
          </h1>
          {/* Shown as written: "c. 1780", "1950s", "Late Georgian". */}
          <p className="order-first text-base text-zinc-600 dark:text-zinc-400">
            {piece.made}
          </p>
        </header>
      </article>
    </Container>
  )
}
