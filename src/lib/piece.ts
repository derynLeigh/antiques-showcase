import { z } from 'zod'

// Each message follows the field name in a build error, so it reads as plain
// English: "title is required", "dimensions must be text".

// Trimmed first, so text that is only spaces counts as missing.
const requiredText = z
  .string({ error: 'is required' })
  .trim()
  .min(1, 'is required')

// Blank text counts as not given, so the key facts panel leaves it out rather
// than showing a label with nothing after it.
const optionalText = z
  .string({ error: 'must be text' })
  .trim()
  .transform((text) => (text === '' ? undefined : text))
  .optional()

const trueOrFalse = z.boolean({ error: 'must be true or false' })

// A single word ending in an image extension, such as IMG_2231.jpg: the file
// name left in place of a description.
const looksLikeFileName = /^\S+\.(jpe?g|png|gif|webp|avif|heic|tiff?)$/i

const image = z.object({
  src: z.object({ src: z.string(), width: z.number(), height: z.number() }),
  alt: z
    .string({ error: 'must describe the photo' })
    .trim()
    .min(1, 'must describe the photo')
    .refine((alt) => !looksLikeFileName.test(alt), {
      error: (issue) => `must describe the photo (got "${issue.input}")`,
    }),
  caption: optionalText,
})

// Sources become links on the piece page, so only http and https are allowed:
// a javascript: link would run script when clicked.
const source = z.object({
  label: requiredText,
  url: z
    .url({
      protocol: /^https?$/,
      error: 'must be a full web address, like https://example.com',
    })
    .optional(),
})

export const pieceMeta = z.object({
  title: requiredText,
  summary: requiredText, // one line: cards, link previews, RSS
  made: requiredText, // as he'd say it: "c. 1780", "1950s"
  origin: optionalText,
  maker: optionalText,
  materials: optionalText,
  dimensions: optionalText, // free text: "22 inch wingspan"
  images: z
    .array(image, { error: 'must have at least one photo' })
    .min(1, 'must have at least one photo'), // the first is the hero
  openToOffers: trueOrFalse,
  featured: trueOrFalse.default(false),
  addedOn: z.iso.date({ error: 'must be a date like 2026-11-15' }), // when it joined the site
  sources: z.array(source).default([]),
})

export type PieceMeta = z.infer<typeof pieceMeta>
export type Piece = PieceMeta & { slug: string; Body: React.ComponentType }
