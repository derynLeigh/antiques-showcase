import { z } from 'zod'

const image = z.object({
  src: z.object({ src: z.string(), width: z.number(), height: z.number() }),
  alt: z.string().trim().min(1),
  caption: z.string().optional(),
})

export const pieceMeta = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),          // one line: cards, link previews, RSS
  made: z.string().min(1),             // as he'd say it: "c. 1780", "1950s"
  origin: z.string().optional(),
  maker: z.string().optional(),
  materials: z.string().optional(),
  dimensions: z.string().optional(),   // free text: "22 inch wingspan"
  images: z.array(image).min(1),       // the first is the hero
  openToOffers: z.boolean(),
  featured: z.boolean().default(false),
  addedOn: z.iso.date(),               // when it joined the site
  sources: z.array(z.object({ label: z.string(), url: z.url().optional() })).default([]),
})

export type PieceMeta = z.infer<typeof pieceMeta>
export type Piece = PieceMeta & { slug: string; Body: React.ComponentType }