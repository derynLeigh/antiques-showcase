import { Card } from '@/components/Card'
import { Container } from '@/components/Container'
import { getAllPieces } from '@/lib/pieces'

// Every piece, in the curator's order, each linking to its own page.
export default async function CollectionPage() {
  const pieces = await getAllPieces()

  return (
    <Container className="mt-16 sm:mt-32">
      <div className="flex max-w-3xl flex-col space-y-16">
        {pieces.map((piece) => (
          <Card as="article" key={piece.slug}>
            <Card.Title href={`/collection/${piece.slug}`}>
              {piece.title}
            </Card.Title>
          </Card>
        ))}
      </div>
    </Container>
  )
}
