// Where pieces come from. Only a source knows how they're stored (MDX files
// today, a CMS later), so the repository and every page stay the same when the
// storage changes.

export interface RawPiece {
  slug: string
  meta: unknown // unchecked: whatever the source found
  Body: React.ComponentType
}

export interface PieceSource {
  list(): Promise<RawPiece[]>
  order(): Promise<string[]> // slugs, in the curator's order
}
