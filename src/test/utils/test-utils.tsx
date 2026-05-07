import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'
import { NextIntlClientProvider } from 'next-intl'

// Default messages for testing
const messages = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    loading: 'Loading...',
  },
}

interface AllTheProvidersProps {
  children: React.ReactNode
  locale?: string
}

function AllTheProviders({ children, locale = 'en' }: AllTheProvidersProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { locale?: string }
) => {
  const { locale, ...renderOptions } = options || {}
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders locale={locale}>{children}</AllTheProviders>
    ),
    ...renderOptions,
  })
}

export * from '@testing-library/react'
export { customRender as render }