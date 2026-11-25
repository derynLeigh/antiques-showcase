import { type Metadata } from 'next'
import Image from 'next/image'

import { Card } from '@/components/Card'
import { SimpleLayout } from '@/components/SimpleLayout'
import type { Piece } from '@/lib/piece'
import { getAllPieces } from '@/lib/pieces'

// The root layout's title template adds the site name to the tab title. The
// description is placeholder text, like the intro below.
const title = 'The collection'
const description = 'Every piece in the collection, with its story.'

export const metadata: Metadata = {
  title,
  description,
  // Link previews in chat apps and social sites.
  openGraph: { type: 'website', title, description },
  twitter: { card: 'summary', title, description },
}

// The first card's photo is usually the largest thing on screen when the page
// opens, so it loads straight away, ahead of other images. The rest load as
// they're scrolled to.
function PieceCard({ piece, isFirst }: { piece: Piece; isFirst: boolean }) {
  // The first photo is the main one, and the schema makes sure there is one.
  const [mainPhoto] = piece.images

  return (
    <Card as="article">
      {/* order-first puts the photo above the date, which is also order-first
          but comes later. Next resizes it to suit the screen. relative z-10
          keeps it above Card.Link's hover background (z-0), as the card's text
          is, and below the link's clickable overlay (z-20). */}
      <Image
        src={mainPhoto.src}
        alt={mainPhoto.alt}
        sizes="(min-width: 768px) 48rem, 100vw"
        loading={isFirst ? 'eager' : 'lazy'}
        fetchPriority={isFirst ? 'high' : 'auto'}
        className="relative z-10 order-first mb-4 h-auto w-full rounded-2xl bg-zinc-100 dark:bg-zinc-800"
      />
      <Card.Title href={`/collection/${piece.slug}`}>{piece.title}</Card.Title>
      {/* Shown as written: "c. 1780", "1950s", "Late Georgian".
          Card.Eyebrow's own grey is too faint to read. It keeps its class
          alongside ours, so ! makes this colour win. */}
      <Card.Eyebrow decorate className="text-zinc-600! dark:text-zinc-400!">
        {piece.made}
      </Card.Eyebrow>
      <Card.Description>{piece.summary}</Card.Description>
    </Card>
  )
}

// Every piece, in the curator's order, each linking to its own page.
export default async function CollectionPage() {
  const pieces = await getAllPieces()

  return (
    // The intro is placeholder text, to be replaced with the curator's words.
    <SimpleLayout title="The collection" intro="Every piece, with its story.">
      {pieces.length === 0 ? (
        <p className="text-base text-zinc-600 dark:text-zinc-400">
          No pieces have been added yet.
        </p>
      ) : (
        <div className="flex max-w-3xl flex-col space-y-16">
          {pieces.map((piece, index) => (
            <PieceCard key={piece.slug} piece={piece} isFirst={index === 0} />
          ))}
        </div>
      )}
    </SimpleLayout>
  )
}
