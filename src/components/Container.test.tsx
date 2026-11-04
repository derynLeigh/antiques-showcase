import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Container } from '@/components/Container'

// Harness check: proves React components render under jsdom with jest-dom matchers.
describe('Container', () => {
  it('renders its children', () => {
    render(<Container>Placeholder content</Container>)

    expect(screen.getByText('Placeholder content')).toBeInTheDocument()
  })
})
