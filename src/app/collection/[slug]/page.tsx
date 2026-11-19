import { Container } from '@/components/Container'
import { getPiece } from '@/lib/pieces'

export default async function PiecePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const piece = await getPiece(slug)
  if (!piece) return null

  return (
    <Container className="mt-16 lg:mt-32">
      <article className="mx-auto max-w-2xl">
        <header className="flex flex-col">
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-zinc-800 sm:text-5xl dark:text-zinc-100">
            {piece.title}
          </h1>
          {/* Shown as written: "c. 1780", "1950s", "Late Georgian". */}
          <p className="order-first text-base text-zinc-400 dark:text-zinc-500">
            {piece.made}
          </p>
        </header>
      </article>
    </Container>
  )
}
