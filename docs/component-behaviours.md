# Component behaviours and what to test

Draft for discussion. Each component or module from the Spotlight scaffold is listed with what it actually does, then sorted into three kinds of test:

- **Characterise:** template behaviour we're keeping. Write a test that pins down what it does today, so later refactors can't break it silently.
- **Drive:** behaviour that changes for the showcase. Write the failing test for the *new* behaviour first, then change the code (red, green, refactor).
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

---

## Shared components

### `Button` (`src/components/Button.tsx`)

What it does: renders a `<button>` when there's no `href`, and a Next `<Link>` when there is one. Two visual variants: `primary` (default) and `secondary`. Passes all other props through.

| Behaviour | Kind | Level |
| --- | --- | --- |
| Without `href`, renders a button you can find by role `button` | Characterise | Component |
| With `href`, renders a link with that `href` (role `link`) | Characterise | Component |
| Passes through props such as `type="submit"`, `disabled`, `onClick` | Characterise | Component |
| Clicking a button calls `onClick` | Characterise | Component |
| Variant class names | Skip | |

Notes: this becomes the "Make an offer or ask a question" trigger, so the button/link split matters.

### `Card` and its parts (`src/components/Card.tsx`)

What it does: a compound component. `Card` renders as any element via `as`. `Card.Title` renders a heading (default `h2`) and wraps its text in `Card.Link` when given `href`. `Card.Link` makes the whole card clickable with an overlay span. `Card.Eyebrow` renders a small label (default `p`, often `time`) with an optional decorative bar. `Card.Cta` is a visual "Read article" prompt that is `aria-hidden`. `Card.Description` is a paragraph.

| Behaviour | Kind | Level |
| --- | --- | --- |
| `Card` renders as the element passed in `as` (for example `article`, `li`) | Characterise | Component |
| `Card.Title` with `href` renders a heading containing a link to that `href` | Characterise | Component |
| `Card.Title` without `href` renders plain heading text, no link | Characterise | Component |
| The card's accessible link name is the title text only | Characterise | Component |
| `Card.Cta` is hidden from assistive technology | Characterise | Component |
| `Card.Eyebrow` with `as="time"` keeps its `dateTime` attribute | Characterise | Component |
| `Card.Eyebrow` with `decorate` adds a decorative bar | Skip: purely visual with no text, so a test could only query the markup | |
| Hover and overlay styling | Skip | |

Notes: these are the building blocks of the collection gallery, so they're worth pinning down early.

### `Container`, `ContainerOuter`, `ContainerInner`

What it does: nested width-limiting `div`s. Forwards refs and extra props.

| Behaviour | Kind | Level |
| --- | --- | --- |
| Renders children (harness test already does this) | Characterise | Component |
| Forwards a ref to the outer element | Characterise | Component (optional) |
| Width and padding classes | Skip | |

### `SimpleLayout`

What it does: page header with an `h1` title and intro paragraph; renders a children wrapper only when there are children.

| Behaviour | Kind | Level |
| --- | --- | --- |
| Shows the title as the page's level-1 heading | Characterise | Component |
| Shows the intro text | Characterise | Component |
| Renders children when given; renders no wrapper when not | Characterise | Component |

### `Section`

Now unused (it was only used by the removed Speaking and Uses pages). **Decision needed:** delete it, or keep it for "Our music" in Next. If kept: it labels a `<section>` with its `h2` via `aria-labelledby`, so `getByRole('region', { name })` should find it.

### `Prose`

Wraps MDX content in Tailwind Typography classes and passes props through. **Skip**, apart from what `ArticleLayout` covers.

### `SocialIcons`

Pure SVG. **Skip.** Accessible names come from the links that wrap them, which are tested where they're used.

---

## Site shell

### `Header` (`src/components/Header.tsx`)

The most complex component. Several behaviours bundled together:

#### Navigation

| Behaviour | Kind | Level |
| --- | --- | --- |
| Desktop nav lists the site's pages as links | Drive (links will change: Collection, About) | Component |
| The link for the current page is marked active | Drive: add `aria-current="page"`. Today "active" is only a colour class, which screen readers can't see and tests can only check via class names | Component |
| Mobile "Menu" button opens a panel containing the same links | Characterise | Component |
| "Close menu" closes the panel | Characterise | Component |
| Choosing a link in the mobile panel closes it | Characterise | Component / e2e |

#### Theme toggle

| Behaviour | Kind | Level |
| --- | --- | --- |
| Before mount, label is "Toggle theme" (avoids a hydration mismatch) | Characterise | Component |
| After mount, label says which theme it will switch to ("Switch to dark theme") | Characterise | Component |
| Clicking it calls `setTheme` with the other theme | Characterise | Component, with `next-themes` mocked |
| The theme persists across reloads | Characterise | End-to-end |

#### Avatar

| Behaviour | Kind | Level |
| --- | --- | --- |
| On the home page, shows the large avatar; elsewhere, the small one | Characterise | Component |
| Avatar links home with accessible name "Home" | Characterise | Component |

#### Scroll-driven header and avatar animation

The `useEffect` calculates header height, margins and avatar scale from `window.scrollY` and writes CSS custom properties to `<html>`.

| Behaviour | Kind | Level |
| --- | --- | --- |
| Avatar scales from 1 to 36/64 and shifts right as you scroll past the delay | Characterise after refactor | Unit |
| Header becomes fixed once you've scrolled past the avatar | Characterise after refactor | Unit |
| It looks right while scrolling | Skip, or a single visual check | End-to-end |

**Architecture note:** the maths is pure, but it's trapped inside an effect that reads the DOM and writes CSS variables, so it can only be tested through jsdom, which has no layout. Extract it into pure functions, for example `avatarTransform(scrollY, downDelay)` and `headerStyles({ scrollY, top, height, downDelay, isInitial })`, that return values. Then the effect just reads the DOM, calls them and writes the results. This is the "functional core, imperative shell" pattern: unit tests cover the core, and the thin shell needs at most one end-to-end check. `clamp` comes out with them and gets its own unit tests.

### `Footer`

| Behaviour | Kind | Level |
| --- | --- | --- |
| Lists the same pages as the header | Drive (links will change) | Component |
| Shows "© {current year} {site name}" | Characterise, with the system time fixed via `vi.setSystemTime` | Component |

Notes: header and footer both hard-code the nav list. A shared `navigation` array would make "header and footer match" true by construction rather than by test.

### `Layout`

Composes the header, main content and footer. **Skip** at component level; one end-to-end smoke test ("every page renders a header, a main landmark and a footer") covers it.

### `Providers` (`src/app/providers.tsx`)

| Behaviour | Kind | Level |
| --- | --- | --- |
| Exposes the previous pathname through `AppContext` after navigation | Characterise | Component, with `usePathname` mocked and the provider rerendered with a new path |
| On first render there is no previous pathname | Characterise | Component |
| `ThemeWatcher` switches to "system" when the chosen theme matches the OS setting | Characterise | Component, with `matchMedia` mocked (jsdom doesn't provide it) |

### `ArticleLayout` (becomes the piece page layout)

| Behaviour | Kind | Level |
| --- | --- | --- |
| Shows the title as the `h1` and the formatted date in a `time` element | Characterise | Component |
| Renders the MDX body inside the prose wrapper | Characterise | Component |
| Shows a "Go back" button only when there is a previous page, and it calls `router.back()` | Characterise | Component, with `AppContext` and `useRouter` mocked |
| Photo gallery, key facts and offer button | **Drive** | Component |

This is where most of the showcase's new behaviour will be test-driven.

---

## Pages

Next 16 pages are async server components. React Testing Library can render one by awaiting it first: `render(await Home())`.

| Page | Behaviour | Kind | Level |
| --- | --- | --- | --- |
| Home | Lists the most recent articles (at most four), newest first | Characterise now, then drive into "recently added pieces" | Component, with `getAllArticles` mocked |
| Home | Photo strip shows five photos | Drive (becomes featured pieces) | Component |
| Home | Placeholder list (old "Work" panel): each entry shows organisation, role and a date range with an accessible label "2000 until Present" | Characterise if kept for "Our past lives" | Component |
| Articles index | Lists every article with a link to `/articles/{slug}` | Drive (becomes the collection gallery) | Component |
| About | Headline, paragraphs, social links and email link | Drive once real content and SoundCloud links exist | Component |
| Projects | One card per project with a link | Later ("Our music") | |
| Thank you | Shows the confirmation title | Drive (becomes the offer confirmation) | Component |
| Not found | Shows "Page not found" and a link home | Characterise | Component |

---

## Data and server code

### `lib/articles.ts` (becomes `lib/pieces.ts`)

What it does: globs `src/app/articles/*/page.mdx` from the file system, dynamically imports each one to read its exported `article` metadata, adds a slug from the folder name, and sorts newest first.

| Behaviour | Kind | Level |
| --- | --- | --- |
| Slug comes from the folder name | Characterise | Unit |
| Sorted newest first | Characterise, then drive "sorted by date made" | Unit |

**Architecture note:** it's hard to unit test as written, because the file system lookup and the MDX import are hard-wired. This is where the repository layer goes: `getAllPieces()` and `getPiece(slug)` sit in front of a small source interface. Tests give the repository an in-memory source, and production gives it the MDX source. This is the same seam that lets you swap in a CMS later.

### `formatDate`

Covered by the harness test: long US-style date, no time-zone shift. **Drive:** the site is British, so this should probably become `en-GB` ("1 January 2026"). Antiques also need approximate dates such as "c. 1780", which suggests the piece's display date is a separate field from any sortable year.

### `feed.xml` route

What it does today: lists the MDX folders, then **fetches each rendered article page over HTTP from itself** and scrapes the title, date and body out of the HTML with cheerio to build an RSS feed. It throws if `NEXT_PUBLIC_SITE_URL` is missing.

| Behaviour | Kind | Level |
| --- | --- | --- |
| Throws a clear error when `NEXT_PUBLIC_SITE_URL` is missing | Characterise | Unit |
| Produces valid RSS with one item per piece | Drive | Unit, once it builds from the repository |
| Responds with `content-type: application/xml` | Characterise | Unit or end-to-end |

**Architecture note:** scraping your own HTML couples the feed to page markup. Changing a heading level breaks the feed. Once `lib/pieces.ts` exists, build the feed from piece data and test it as a pure function.

### `mdx-components.tsx`

Maps an `Image` component into MDX. **Skip**; it's covered when a piece page renders an image end to end.

---

## Test doubles we'll need

- **`next/navigation`:** mock `usePathname` and `useRouter` (Header, Providers, ArticleLayout).
- **`next-themes`:** mock `useTheme` to assert `setTheme` calls.
- **`window.matchMedia`:** jsdom doesn't implement it, so it needs a small stub in `vitest.setup.ts`.
- **Static images:** in Next, `import avatar from './avatar.jpg'` gives an object with width and height; under Vitest it's a plain string, and `next/image` then complains about missing dimensions. Either mock `next/image` with a plain `<img>`, or add a Vite plugin that returns `{ src, width, height }` for image imports.
- **Time:** `vi.setSystemTime` for anything showing the current year.

## Suggested order

1. Shared components (`Button`, `Card`, `SimpleLayout`): quick characterisation tests that teach the testing patterns.
2. `Header` navigation and theme toggle, including driving `aria-current`.
3. The pure-function refactor of the header scroll logic.
4. The repository layer (`lib/pieces.ts`), test-first. This is the first real piece of showcase architecture.
5. The piece page: gallery, key facts and offer button, test-first.
6. Set up Playwright once there's a real piece page worth checking end to end.
