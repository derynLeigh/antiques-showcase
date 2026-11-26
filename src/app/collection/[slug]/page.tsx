import { type Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Fragment } from 'react'

import { Container } from '@/components/Container'
import { Prose } from '@/components/Prose'
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

  const { title, summary: description } = piece
  return {
    title,
    description,
    // Link previews in chat apps and social sites. The photo comes with BOB-24.
    openGraph: { type: 'article', title, description },
    twitter: { card: 'summary', title, description },
  }
}

export default async function PiecePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const piece = await getPiece(slug)
  if (!piece) notFound()

  // Only the facts that are known, so a label never has nothing after it.
  const facts = [
    { label: 'Origin', value: piece.origin },
    { label: 'Maker', value: piece.maker },
    { label: 'Materials', value: piece.materials },
    { label: 'Dimensions', value: piece.dimensions },
  ].filter(({ value }) => value !== undefined)

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
        {/* In the curator's order. The first is the main photo, usually the
            largest thing on screen when the page opens, so it loads straight
            away, ahead of other images. The rest load as they're scrolled to.
            sizes matches the article's width (max-w-2xl, 42rem), so a phone
            downloads a phone-sized copy. */}
        <div className="mt-8 space-y-8">
          {piece.images.map((photo, index) => (
            <figure key={photo.src.src}>
              <Image
                src={photo.src}
                alt={photo.alt}
                sizes="(min-width: 768px) 42rem, 100vw"
                loading={index === 0 ? 'eager' : 'lazy'}
                fetchPriority={index === 0 ? 'high' : 'auto'}
                className="h-auto w-full rounded-2xl bg-zinc-100 dark:bg-zinc-800"
              />
              {/* Left out when there's no caption, rather than left empty. */}
              {photo.caption && (
                <figcaption className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                  {photo.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
        {facts.length > 0 && (
          <section className="mt-8">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Key facts
            </h2>
            {/* Each value is shown as written: "22 inch wingspan", not a
                converted measurement. */}
            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-base">
              {facts.map(({ label, value }) => (
                <Fragment key={label}>
                  <dt className="font-medium text-zinc-800 dark:text-zinc-100">
                    {label}
                  </dt>
                  <dd className="text-zinc-600 dark:text-zinc-400">{value}</dd>
                </Fragment>
              ))}
            </dl>
          </section>
        )}
        {/* The story: the MDX below the piece's details, in the curator's
            voice. Prose sets a comfortable size, line height and spacing for
            reading on a phone, and styles the template's ## headings. */}
        <Prose className="mt-8">
          <piece.Body />
        </Prose>
        {piece.sources.length > 0 && (
          <section className="mt-12">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Sources
            </h2>
            {/* A source with a web address links to it. One without, such as
                a book or a conversation, is plain text. role="list" keeps it a
                list for VoiceOver: Safari drops list semantics when the
                markers are styled away, as Tailwind does outside Prose. */}
            <ul
              role="list"
              className="mt-4 space-y-2 text-base text-zinc-600 dark:text-zinc-400"
            >
              {piece.sources.map((source, index) => (
                <li key={index}>
                  {source.url ? (
                    <a
                      href={source.url}
                      className="text-teal-600 underline hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300"
                    >
                      {source.label}
                    </a>
                  ) : (
                    source.label
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </Container>
  )
}
