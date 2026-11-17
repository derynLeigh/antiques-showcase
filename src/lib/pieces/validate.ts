import { pieceMeta, type Piece } from '@/lib/piece'
import type { RawPiece } from '@/lib/pieces/source'

// Nothing from a source is trusted until it has been checked. Returns the
// pieces with schema defaults filled in (such as featured: false), or throws
// one error listing every problem, so one build reports everything to fix.
export function validate(raws: RawPiece[], order: string[]): Piece[] {
  const problems = slugProblems(raws, order)
  const pieces: Piece[] = []

  for (const { slug, meta, Body } of raws) {
    const result = pieceMeta.safeParse(meta)
    if (result.success) {
      pieces.push({ ...result.data, slug, Body })
    } else {
      for (const issue of result.error.issues) {
        problems.push(`${slug}: ${formatPath(issue.path)} ${issue.message}`)
      }
    }
  }

  if (problems.length > 0) {
    throw new Error(report(problems))
  }
  return pieces
}

// Slugs used more than once, and slugs in the order list with no piece
// (almost always a typo).
function slugProblems(raws: RawPiece[], order: string[]): string[] {
  const problems: string[] = []

  const slugCounts = new Map<string, number>()
  for (const { slug } of raws) {
    slugCounts.set(slug, (slugCounts.get(slug) ?? 0) + 1)
  }
  for (const [slug, count] of slugCounts) {
    if (count > 1) {
      problems.push(`${slug}: slug is used by more than one piece`)
    }
  }

  for (const slug of order) {
    if (!slugCounts.has(slug)) {
      problems.push(`${slug}: is in the order list, but no piece has that slug`)
    }
  }

  return problems
}

// Writes a field path the way it would appear in code, such as images[1].alt,
// so the error points straight at the place to fix.
function formatPath(path: PropertyKey[]) {
  return path.reduce<string>((text, key) => {
    if (typeof key === 'number') return `${text}[${key}]`
    return text ? `${text}.${String(key)}` : String(key)
  }, '')
}

function report(problems: string[]) {
  const heading =
    problems.length === 1
      ? 'The collection has 1 problem:'
      : `The collection has ${problems.length} problems:`
  return [heading, ...problems.map((problem) => `  ${problem}`)].join('\n')
}
