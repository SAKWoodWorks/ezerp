# Testing Guide

## Setup

This project uses **Vitest** for unit and integration testing, along with **React Testing Library** for component testing.

## Installation

Run the following command to install all testing dependencies:

```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom happy-dom @vitejs/plugin-react
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## Project Structure

```
src/
├── test/
│   ├── setup.ts              # Global test configuration
│   ├── test-utils.tsx        # Custom render with providers
│   └── mocks/
│       └── supabase.ts       # Supabase mock utilities
├── components/
│   └── ui/
│       └── button.test.tsx   # Component tests
├── lib/
│   └── utils.test.ts         # Utility function tests
└── app/
    └── customers/
        └── actions.test.ts   # Server action tests
```

## Writing Tests

### Component Tests

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './button'

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('handles click events', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(<Button onClick={handleClick}>Click me</Button>)
    await user.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### Server Action Tests

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { addCustomer } from './actions'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

vi.mock('@/lib/supabase/server')
vi.mock('next/navigation')

describe('addCustomer', () => {
  const mockSupabase = {
    auth: { getUser: vi.fn() },
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  }

  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  it('redirects to login if not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const formData = new FormData()
    await addCustomer(formData)

    expect(redirect).toHaveBeenCalledWith('/login')
  })
})
```

## Mocking

### Mocking Supabase

Use the provided mock utilities from `@/test/mocks/supabase`:

```typescript
import { createMockSupabaseClient, mockSupabaseResponse } from '@/test/mocks/supabase'

const mockClient = createMockSupabaseClient()

// Mock successful response
mockClient.from('customers').select().mockResolvedValue(
  mockSupabaseResponse([{ id: 1, name: 'Test Customer' }])
)

// Or use in tests
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => createMockSupabaseClient(),
}))
```

### Mocking Next.js Router

Already configured in `setup.ts`. For custom behavior:

```typescript
import { useRouter } from 'next/navigation'

vi.mocked(useRouter).mockReturnValue({
  push: vi.fn(),
  // ... other methods
})
```

## Coverage Goals

- **Unit Tests:** Aim for 80%+ coverage on utilities and helpers
- **Component Tests:** Test user interactions and edge cases
- **Integration Tests:** Test critical user flows (login, CRUD operations)

## Best Practices

1. ✅ Test behavior, not implementation
2. ✅ Use semantic queries (`getByRole`, `getByLabelText`)
3. ✅ Test accessibility
4. ✅ Mock external dependencies (Supabase, APIs)
5. ✅ Keep tests focused and isolated
6. ❌ Don't test third-party libraries
7. ❌ Don't test styling details

## CI/CD Integration

Add to `.github/workflows/test.yml`:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm test
```

## Example Test Files

The following example tests have been created:

1. **Component Test:** `src/components/ui/button.test.tsx`
2. **Utility Test:** `src/lib/utils.test.ts`
3. **Server Action Test:** `src/app/customers/actions.test.ts`

## Running Your First Test

```bash
# Run all tests
npm test

# Run specific test file
npm test button.test

# Run with UI
npm run test:ui
```

## Next Steps

1. ✅ Dependencies installed
2. ✅ Test setup configured
3. ✅ Example tests created
4. 📝 Write tests for critical business logic:
   - Invoice creation/editing
   - Product inventory management
   - Customer CRUD operations
   - Asset checkout/return flows
5. 🚀 Set up CI/CD pipeline
6. 📊 Gradually increase coverage to 80%+