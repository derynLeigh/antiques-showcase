import { type Metadata } from 'next'

import { Card } from '@/components/Card'
import { SimpleLayout } from '@/components/SimpleLayout'
import type { Piece } from '@/lib/piece'
import { getAllPieces } from '@/lib/pieces'

// The root layout's title template adds the site name to the tab title. The
// description is placeholder text, like the intro below.
export const metadata: Metadata = {
  title: 'The collection',
  description: 'Every piece in the collection, with its story.',
}

function PieceCard({ piece }: { piece: Piece }) {
  return (
    <Card as="article">
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
          {pieces.map((piece) => (
            <PieceCard key={piece.slug} piece={piece} />
          ))}
        </div>
      )}
    </SimpleLayout>
  )
}
