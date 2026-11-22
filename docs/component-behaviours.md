# Component behaviours and what to test

Started as the plan for testing the Spotlight scaffold, and kept up to date as the work happens. Each component or module is listed with what it actually does, then sorted into three kinds of test:

- **Characterise:** template behaviour we're keeping. Write a test that pins down what it does today, so later refactors can't break it silently.
- **Drive:** behaviour that changes for the showcase. Write the failing test for the _new_ behaviour first, then change the code (red, green, refactor).
- **Skip:** styling, layout or pure markup where a test would only restate the class names.

Test levels:

- **Unit:** Vitest, pure functions, no DOM.
- **Component:** Vitest + React Testing Library in jsdom. Query by role and accessible name, the way a user or screen reader finds things.
- **End-to-end:** Playwright against `next build && next start` (not set up yet). For anything that needs a real browser: scrolling, real routing, CSS media queries, server routes.

Conventions (`src/components/Button.test.tsx` is the reference example):

- **Location:** colocate the test with the code it tests, named after it: `Button.tsx` → `Button.test.tsx` in the same folder. Vitest picks up `src/**/*.test.{ts,tsx}`.
- **Imports:** import the code under test through the `@/` alias.
- **`describe`:** the outer block is the exported name exactly (`Button`, `formatDate`). Nest a `describe` for each condition that changes the behaviour, written as a phrase that follows the name: `without an href`, `with an href`, `when disabled`.
- **`it`:** present tense, describing the behaviour someone can observe, with no "should": `renders a link to that href named by its content`, `calls onClick when clicked`. Read together they make a sentence: "Button, with an href, renders a link to that href…".
- **Queries:** `getByRole` with an accessible `name` first, then `getByLabelText` or `getByText`. Never query by class name or test ID. Use `queryBy…` only to show that something is absent.
- **Interaction:** use `userEvent.setup()` at the start of each test, not `fireEvent`.
- **What to test:** the behaviour that later work depends on, and the difference between similar cases (button versus link, not just "it renders"). Don't test styling.
- **Shape:** arrange, act, assert, with a blank line between each step.

## Where things stand (22 November 2026)

- **Characterised:** `Button`, `Card`, `Container`, `SimpleLayout`, `Footer`, `Header` (navigation, mobile menu, theme toggle and link home) and the not-found page.
- **Driven, test-first:**
  - the piece content model and repository (`src/lib/piece.ts`, `src/lib/pieces/`)
  - the piece page (`/collection/<slug>`, BOB-8)
  - the collection page (`/collection`, BOB-45)
  - Collection replacing Articles in the header and footer (BOB-46)
- **Removed in BOB-46:** the template's articles pages, `ArticleLayout`, `lib/articles.ts`, the home page's article list and the RSS feed.
- **Still to do:**
  - the header scroll refactor
  - `Providers`
  - Playwright
  - the piece page's photos, key facts, story and offer button
  - the home page's featured and recently added pieces
  - a pieces feed

---

## Shared components

### `Button` (`src/components/Button.tsx`)

What it does: renders a `<button>` when there's no `href`, and a Next `<Link>` when there is one. Two visual variants: `primary` (default) and `secondary`. Passes all other props through.

| Behaviour                                                           | Kind         | Level     |
| ------------------------------------------------------------------- | ------------ | --------- |
| Without `href`, renders a button you can find by role `button`      | Characterise | Component |
| With `href`, renders a link with that `href` (role `link`)          | Characterise | Component |
| Passes through props such as `type="submit"`, `disabled`, `onClick` | Characterise | Component |
| Clicking a button calls `onClick`                                   | Characterise | Component |
| Variant class names                                                 | Skip         |           |

Notes: this becomes the "Make an offer or ask a question" trigger, so the button/link split matters.

### `Card` and its parts (`src/components/Card.tsx`)

What it does: a compound component. `Card` renders as any element via `as`. `Card.Title` renders a heading (default `h2`) and wraps its text in `Card.Link` when given `href`. `Card.Link` makes the whole card clickable with an overlay span. `Card.Eyebrow` renders a small label (default `p`, often `time`) with an optional decorative bar. `Card.Cta` is a visual "Read article" prompt that is `aria-hidden`. `Card.Description` is a paragraph.

| Behaviour                                                                   | Kind                                                                    | Level     |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------- | --------- |
| `Card` renders as the element passed in `as` (for example `article`, `li`)  | Characterise                                                            | Component |
| `Card.Title` with `href` renders a heading containing a link to that `href` | Characterise                                                            | Component |
| `Card.Title` without `href` renders plain heading text, no link             | Characterise                                                            | Component |
| The card's accessible link name is the title text only                      | Characterise                                                            | Component |
| `Card.Cta` is hidden from assistive technology                              | Characterise                                                            | Component |
| `Card.Eyebrow` with `as="time"` keeps its `dateTime` attribute              | Characterise                                                            | Component |
| `Card.Eyebrow` with `decorate` adds a decorative bar                        | Skip: purely visual with no text, so a test could only query the markup |           |
| Hover and overlay styling                                                   | Skip                                                                    |           |

Notes: the collection page's cards (`src/app/collection/page.tsx`) are built from these.

### `Container`, `ContainerOuter`, `ContainerInner`

What it does: nested width-limiting `div`s. Forwards refs and extra props.

| Behaviour                                         | Kind         | Level                |
| ------------------------------------------------- | ------------ | -------------------- |
| Renders children (harness test already does this) | Characterise | Component            |
| Forwards a ref to the outer element               | Characterise | Component (optional) |
| Width and padding classes                         | Skip         |                      |

### `SimpleLayout`

What it does: page header with an `h1` title and intro paragraph; renders a children wrapper only when there are children.

| Behaviour                                             | Kind                                                                      | Level     |
| ----------------------------------------------------- | ------------------------------------------------------------------------- | --------- |
| Shows the title as the page's level-1 heading         | Characterise                                                              | Component |
| Shows the intro text                                  | Characterise                                                              | Component |
| Renders children after the title and intro            | Characterise                                                              | Component |
| Renders no spacing wrapper when there are no children | Skip: the wrapper only adds margin, so a test could only query the markup |           |

### `Section`

Now unused (it was only used by the removed Speaking and Uses pages). **Decision needed:** delete it, or keep it for "Our music" in Next. If kept: it labels a `<section>` with its `h2` via `aria-labelledby`, so `getByRole('region', { name })` should find it.

### `Prose`

Wraps MDX content in Tailwind Typography classes and passes props through. **Skip.** Nothing uses it since `ArticleLayout` was removed. The piece story (BOB-35) will render inside it, and that page's tests cover it.

### `SocialIcons`

Pure SVG. **Skip.** Accessible names come from the links that wrap them, which are tested where they're used.

---

## Site shell

### `Header` (`src/components/Header.tsx`)

The most complex component. Several behaviours bundled together:

#### Navigation

| Behaviour                                                    | Kind                                                                                                              | Level           |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | --------------- |
| Desktop nav lists the site's pages as links                  | Drive: done. About and Collection (BOB-46)                                                                        | Component       |
| The link for the current page is marked active               | Drive: done. Adds `aria-current="page"`; before, "active" was only a colour class, which screen readers can't see | Component       |
| Mobile "Menu" button opens a panel containing the same links | Characterise                                                                                                      | Component       |
| "Close menu" closes the panel                                | Characterise                                                                                                      | Component       |
| Pressing Escape closes the panel                             | Characterise                                                                                                      | Component       |
| Choosing a link in the mobile panel closes it                | Characterise                                                                                                      | Component / e2e |

#### Theme toggle

| Behaviour                                                                      | Kind         | Level                                |
| ------------------------------------------------------------------------------ | ------------ | ------------------------------------ |
| Before mount, label is "Toggle theme" (avoids a hydration mismatch)            | Characterise | Component                            |
| After mount, label says which theme it will switch to ("Switch to dark theme") | Characterise | Component                            |
| Clicking it calls `setTheme` with the other theme                              | Characterise | Component, with `next-themes` mocked |
| The theme persists across reloads                                              | Characterise | End-to-end                           |

#### Avatar

| Behaviour                                                         | Kind                                                                | Level     |
| ----------------------------------------------------------------- | ------------------------------------------------------------------- | --------- |
| Every page has exactly one link home, with accessible name "Home" | Characterise                                                        | Component |
| On the home page the avatar is large; elsewhere it is small       | Skip: only the size differs, so a test could only check class names |           |

#### Scroll-driven header and avatar animation

The `useEffect` calculates header height, margins and avatar scale from `window.scrollY` and writes CSS custom properties to `<html>`.

| Behaviour                                                                   | Kind                           | Level      |
| --------------------------------------------------------------------------- | ------------------------------ | ---------- |
| Avatar scales from 1 to 36/64 and shifts right as you scroll past the delay | Characterise after refactor    | Unit       |
| Header becomes fixed once you've scrolled past the avatar                   | Characterise after refactor    | Unit       |
| It looks right while scrolling                                              | Skip, or a single visual check | End-to-end |

**Architecture note:** the maths is pure, but it's trapped inside an effect that reads the DOM and writes CSS variables, so it can only be tested through jsdom, which has no layout. Extract it into pure functions, for example `avatarTransform(scrollY, downDelay)` and `headerStyles({ scrollY, top, height, downDelay, isInitial })`, that return values. Then the effect just reads the DOM, calls them and writes the results. This is the "functional core, imperative shell" pattern: unit tests cover the core, and the thin shell needs at most one end-to-end check. `clamp` comes out with them and gets its own unit tests.

### `Footer`

| Behaviour                            | Kind                                                            | Level     |
| ------------------------------------ | --------------------------------------------------------------- | --------- |
| Lists the same pages as the header   | Drive: done. About and Collection (BOB-46)                      | Component |
| Shows "© {current year} {site name}" | Characterise, with the system time fixed via `vi.setSystemTime` | Component |

Notes: the header and footer both read `siteNavigation` from `src/lib/navigation.ts`, so they always match.

### `Layout`

Composes the header, main content and footer. **Skip** at component level; one end-to-end smoke test ("every page renders a header, a main landmark and a footer") covers it.

### `Providers` (`src/app/providers.tsx`)

| Behaviour                                                                        | Kind         | Level                                                                            |
| -------------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------- |
| Exposes the previous pathname through `AppContext` after navigation              | Characterise | Component, with `usePathname` mocked and the provider rerendered with a new path |
| On first render there is no previous pathname                                    | Characterise | Component                                                                        |
| `ThemeWatcher` switches to "system" when the chosen theme matches the OS setting | Characterise | Component, with `matchMedia` mocked (jsdom doesn't provide it)                   |

Notes: nothing reads `AppContext` since `ArticleLayout` was removed. Keep it if the piece page gets a "Go back" button. Otherwise delete it, and its tests aren't needed.

### Piece page (`src/app/collection/[slug]/page.tsx`)

Replaces the template's `ArticleLayout`, which was removed in BOB-46. Built test-first in BOB-8, with `@/lib/pieces` and `next/navigation` mocked.

| Behaviour                                                                                          | Kind                | Level                           |
| -------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------- |
| Shows the title as the level-1 heading, and when it was made exactly as written                    | Drive: done (BOB-8) | Component                       |
| An unknown slug shows the not-found page                                                           | Drive: done (BOB-8) | Component                       |
| One page per piece is built ahead of time, and no others (`generateStaticParams`, `dynamicParams`) | Drive: done (BOB-8) | Component, plus the smoke build |
| Tab title, description and link preview tags from the piece                                        | Drive: done (BOB-8) | Component, plus the smoke build |
| Photos                                                                                             | **Drive** (BOB-19)  | Component                       |
| Key facts                                                                                          | **Drive** (BOB-21)  | Component                       |
| The story, rendered inside `Prose`                                                                 | **Drive** (BOB-35)  | Component                       |
| Link preview photo                                                                                 | **Drive** (BOB-24)  | Component                       |
| Offer button                                                                                       | **Drive**           | Component                       |

This is where most of the showcase's new behaviour is test-driven.

---

## Pages

Pages that read data are async server components. React Testing Library can render one by awaiting it first: `render(await CollectionPage())`.

| Page       | Behaviour                                                                                                                               | Kind                                               | Level                                                       |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------- |
| Home       | Recently added pieces. The template's article list was removed in BOB-46                                                                | **Drive** (BOB-10)                                 | Component, with `@/lib/pieces` mocked                       |
| Home       | Photo strip shows five photos                                                                                                           | **Drive** (becomes featured pieces, BOB-6)         | Component                                                   |
| Home       | Placeholder list (old "Work" panel): each entry shows organisation, role and a date range with an accessible label "2000 until Present" | Characterise if kept for "Our past lives"          | Component                                                   |
| Collection | Lists every piece as a card linking to `/collection/{slug}`, with a message when there are none                                         | Drive: done (BOB-45)                               | Component, with `@/lib/pieces` mocked, plus the smoke build |
| Piece      | See the piece page above                                                                                                                |                                                    |                                                             |
| About      | Headline, paragraphs, social links and email link                                                                                       | Drive once real content and SoundCloud links exist | Component                                                   |
| Projects   | One card per project with a link                                                                                                        | Later ("Our music")                                |                                                             |
| Thank you  | Shows the confirmation title                                                                                                            | Drive (becomes the offer confirmation)             | Component                                                   |
| Not found  | Shows "Page not found" and a link home                                                                                                  | Characterise                                       | Component                                                   |

---

## Data and server code

### Pieces (`src/lib/piece.ts` and `src/lib/pieces/`)

Replaces the template's `lib/articles.ts`, which was removed in BOB-46. Built test-first.

- **`piece.ts`:** the Zod schema for a piece's metadata, with plain-English error messages.
- **`repository.ts`:** `getAllPieces`, `getPiece`, `getRecentlyAdded` and `getFeatured` sit in front of a small source interface. The repository checks every piece and reports every problem in one error. Unit tests give it an in-memory source.
- **`mdx-source.ts`:** the production source. It reads `src/content/pieces/<slug>/index.mdx`, skipping folders that start with `_`, such as `_template`. It's tested against fixture pieces in `__fixtures__`.
- **`index.ts`:** wires the two together for pages. This is the seam that lets a CMS replace the MDX source later.

### `formatDate`

Covered by the harness test: long US-style date, no time-zone shift. Nothing uses it since the articles code was removed. Pieces keep the date made as free text (`made`, such as "c. 1780") and only use the ISO `addedOn` for sorting. If a page shows `addedOn`, for example the recently added list (BOB-10), **drive** it to `en-GB` first ("1 January 2026"), because the site is British.

### `feed.xml` route

Removed in BOB-46, because it was built from the articles pages. It listed the MDX folders, then **fetched each rendered article page over HTTP from itself** and scraped the title, date and body out of the HTML with cheerio.

The pieces feed (BOB-16) should be built from piece data instead, for example from `getRecentlyAdded()`, and tested as a pure function. Scraping your own HTML couples the feed to page markup, so changing a heading level breaks the feed.

| Behaviour                                                 | Kind               | Level              |
| --------------------------------------------------------- | ------------------ | ------------------ |
| Produces valid RSS with one item per recently added piece | **Drive** (BOB-16) | Unit               |
| Responds with `content-type: application/xml`             | **Drive** (BOB-16) | Unit or end-to-end |
| The root layout links to the feed                         | **Drive** (BOB-16) | Unit               |

### `mdx-components.tsx`

Maps an `Image` component into MDX. **Skip**; it's covered when a piece page renders an image end to end.

---

## Test doubles we'll need

- **`next/navigation`:** mock `usePathname` (Header, and Providers when it's tested) and `notFound` (the piece page). Next's `notFound()` throws, so the mock throws too.
- **`@/lib/pieces`:** pages mock it with `vi.hoisted`, so tests choose the pieces they get.
- **`next-themes`:** mock `useTheme` to assert `setTheme` calls.
- **`window.matchMedia`:** jsdom doesn't implement it, so it needs a small stub in `vitest.setup.ts`.
- **Static images:** in Next, `import avatar from './avatar.jpg'` gives an object with width and height; under Vitest it's a plain string. The `staticImageImports` plugin in `vitest.config.mts` returns `{ src, width, height }` for image imports instead.
- **MDX:** `@mdx-js/rollup` in `vitest.config.mts` compiles the fixture pieces, so the MDX source is tested against real files.
- **Time:** `vi.setSystemTime` for anything showing the current year.

## Suggested order

1. Done: shared components (`Button`, `Card`, `SimpleLayout`), with characterisation tests that set the testing patterns.
2. Done: `Header` navigation and theme toggle, including driving `aria-current`.
3. Still to do: the pure-function refactor of the header scroll logic.
4. Done: the repository layer (`src/lib/pieces/`), test-first.
5. Started: the piece page. The title, date made and metadata are done. The photos, key facts, story and offer button are still to do.
6. Still to do: set up Playwright, now that there are real pages worth checking end to end. Until then, the smoke build (`npm run test:build`) checks built pages in CI.
