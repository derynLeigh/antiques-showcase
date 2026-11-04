import { type Metadata } from 'next'

import { SimpleLayout } from '@/components/SimpleLayout'

export const metadata: Metadata = {
  title: 'Thank you',
  description: 'Placeholder confirmation description.',
}

export default function ThankYou() {
  return (
    <SimpleLayout
      title="Placeholder confirmation headline."
      intro="Placeholder confirmation message."
    />
  )
}
