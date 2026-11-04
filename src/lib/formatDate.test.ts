import { describe, expect, it } from 'vitest'

import { formatDate } from './formatDate'

// Harness check: proves Vitest, TypeScript and the @/ path alias are wired up.
// It characterises the template's existing behaviour rather than driving new code.
describe('formatDate', () => {
  it('formats an ISO date as a long US-style date', () => {
    expect(formatDate('2026-01-01')).toBe('January 1, 2026')
  })

  it('does not shift the day across time zones', () => {
    expect(formatDate('2026-12-31')).toBe('December 31, 2026')
  })
})
