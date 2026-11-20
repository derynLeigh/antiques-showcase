import { Card } from '@/components/Card'
import { SimpleLayout } from '@/components/SimpleLayout'
import { getAllPieces } from '@/lib/pieces'

// Every piece, in the curator's order, each linking to its own page.
export default async function CollectionPage() {
  const pieces = await getAllPieces()

  return (
    // The intro is placeholder text, to be replaced with the curator's words.
    <SimpleLayout title="The collection" intro="Every piece, with its story.">
      <div className="flex max-w-3xl flex-col space-y-16">
        {pieces.map((piece) => (
          <Card as="article" key={piece.slug}>
            <Card.Title href={`/collection/${piece.slug}`}>
              {piece.title}
            </Card.Title>
          </Card>
        ))}
      </div>
    </SimpleLayout>
  )
}
