# Collection Showcase

A website for a personal antiques collection: photographs, the story behind each piece, and the people behind it. Selected pieces are open to offers.

Built from the [Tailwind Plus](https://tailwindcss.com/plus) Spotlight template (TypeScript version). All template content has been replaced with placeholders.

## Getting started

```bash
npm install
cp .env.example .env.local   # then set NEXT_PUBLIC_SITE_URL, e.g. http://localhost:3000
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build, including the TypeScript check |
| `npm run lint` | ESLint |
| `npm test` | Run the test suite once (Vitest) |
| `npm run test:watch` | Run tests in watch mode while you work |

## Testing

- Vitest with jsdom and React Testing Library. Config: `vitest.config.mts`; setup: `vitest.setup.ts`.
- Tests live next to the code they cover, as `*.test.ts` or `*.test.tsx`.
- The `@/` path alias works in tests.
- `docs/component-behaviours.md` lists every component's behaviour and what to test, and is the starting point for the test-driven work.

## What changed from the template

- Removed: Speaking and Uses pages, the newsletter form, the three sample articles and their images, and the template's company logos.
- Replaced with placeholders: all copy, the photos, avatar and portrait (generated grey placeholders), the work list, projects, and the site name in the layout, footer and RSS feed.
- Kept as-is for now: the `articles` route and `lib/articles.ts`. They become the collection and `lib/pieces.ts`, driven by tests.

## Licence

The template is a commercial product licensed under the [Tailwind Plus license](https://tailwindcss.com/plus/license).
