import path from 'node:path'

import mdx from '@mdx-js/rollup'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vitest/config'

// In Next, `import avatar from './avatar.jpg'` gives { src, width, height },
// and next/image needs the width and height. Vite gives a plain string, so
// this returns the shape Next would, with placeholder dimensions. The src is
// kept short: next/image repeats it in a srcset for each width, and for a
// `priority` image React looks that srcset up with a CSS selector, which jsdom
// rejects (failing the run) once it passes 2048 characters.
function staticImageImports(): Plugin {
  return {
    name: 'static-image-imports',
    enforce: 'pre',
    load(id) {
      if (/\.(png|jpe?g|gif|webp|avif|svg)$/.test(id)) {
        return `export default { src: ${JSON.stringify(`/${path.basename(id)}`)}, width: 100, height: 100 }`
      }
    },
  }
}

export default defineConfig({
  // MDX compiles before the React plugin, so piece files can be imported in
  // tests the way Next imports them.
  plugins: [staticImageImports(), { enforce: 'pre', ...mdx() }, react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
})
