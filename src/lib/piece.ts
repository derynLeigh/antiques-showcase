import { z } from 'zod'

// A single word ending in an image extension, such as IMG_2231.jpg: the file
// name left in place of a description.
const looksLikeFileName = /^\S+\.(jpe?g|png|gif|webp|avif|heic|tiff?)$/i

const image = z.object({
  src: z.object({ src: z.string(), width: z.number(), height: z.number() }),
  alt: z
    .string()
    .trim()
    .min(1, 'must describe the photo')
    .refine((alt) => !looksLikeFileName.test(alt), {
      error: (issue) => `must describe the photo (got "${issue.input}")`,
    }),
  caption: z.string().optional(),
})

export const pieceMeta = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),          // one line: cards, link previews, RSS
  made: z.string({ error: 'is required' }).min(1, 'is required'), // as he'd say it: "c. 1780", "1950s"
  origin: z.string().optional(),
  maker: z.string().optional(),
  materials: z.string().optional(),
  dimensions: z.string().optional(),   // free text: "22 inch wingspan"
  images: z
    .array(image, { error: 'must have at least one photo' })
    .min(1, 'must have at least one photo'), // the first is the hero
  openToOffers: z.boolean(),
  featured: z.boolean().default(false),
  addedOn: z.iso.date(),               // when it joined the site
  sources: z.array(z.object({ label: z.string(), url: z.url().optional() })).default([]),
})

export type PieceMeta = z.infer<typeof pieceMeta>
export type Piece = PieceMeta & { slug: string; Body: React.ComponentType }