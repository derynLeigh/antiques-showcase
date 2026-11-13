import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Button } from '@/components/Button'

// Button becomes the "Make an offer or ask a question" trigger, so what matters
// is which element it renders: an action (<button>) or navigation (a link).
// Variant styling is deliberately not tested; see docs/component-behaviours.md.
describe('Button', () => {
  describe('without an href', () => {
    it('renders a native button named by its content', () => {
      render(<Button>Make an offer</Button>)

      const button = screen.getByRole('button', { name: 'Make an offer' })

      expect(button.tagName).toBe('BUTTON')
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
    })

    it('calls onClick when clicked', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()
      render(<Button onClick={onClick}>Make an offer</Button>)

      await user.click(screen.getByRole('button', { name: 'Make an offer' }))

      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('does not submit a surrounding form when clicked', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn((event: React.SubmitEvent) =>
        event.preventDefault(),
      )
      render(
        <form onSubmit={onSubmit}>
          <Button>Cancel</Button>
        </form>,
      )

      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('passes through button attributes such as type', () => {
      render(<Button type="submit">Send offer</Button>)

      expect(
        screen.getByRole('button', { name: 'Send offer' }),
      ).toHaveAttribute('type', 'submit')
    })

    it('does not call onClick when disabled', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()
      render(
        <Button disabled onClick={onClick}>
          Make an offer
        </Button>,
      )

      const button = screen.getByRole('button', { name: 'Make an offer' })
      await user.click(button)

      expect(button).toBeDisabled()
      expect(onClick).not.toHaveBeenCalled()
    })
  })

  describe('with an href', () => {
    it('renders a link to that href named by its content', () => {
      render(<Button href="/collection">View the collection</Button>)

      expect(
        screen.getByRole('link', { name: 'View the collection' }),
      ).toHaveAttribute('href', '/collection')
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })
})
