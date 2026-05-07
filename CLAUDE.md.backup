# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**EZ-ERP** is a modern CRM and ERP system built for internal use at SAK Woodworks. The application manages customers, sales, inventory, employees, assets, and various business operations. It supports Thai, English, and Russian languages.

**Important**: This software is proprietary and developed for internal use only. Do not modify, distribute, or use outside of SAK Woodworks without authorization.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database & Auth**: Supabase (PostgreSQL)
- **Language**: TypeScript
- **UI**: shadcn/ui components + Tailwind CSS
- **i18n**: next-intl (cookie-based locale switching)
- **Testing**: Vitest + React Testing Library
- **PDF Generation**: jsPDF, pdf-lib
- **QR Codes**: qrcode.react
- **Barcodes**: react-barcode, html5-qrcode

## Common Commands

```bash
# Development
npm run dev              # Start development server (localhost:3000)

# Building
npm run build            # Production build (creates .next/standalone)
npm start                # Run production server

# Testing
npm test                 # Run Vitest tests
npm run test:watch       # Run tests in watch mode
npm run test:ui          # Open Vitest UI
npm run test:coverage    # Generate coverage report

# Linting
npm run lint             # Run ESLint
```

### Running Single Tests

```bash
# Run a specific test file
npm test -- src/app/products/actions.test.ts

# Run tests matching a pattern
npm test -- --grep "invoice"

# Run in watch mode for a specific file
npm run test:watch -- src/app/products/actions.test.ts
```

## Architecture

### Directory Structure

```
src/
├── app/                    # Next.js App Router pages & routes
│   ├── [module]/          # Feature modules (invoices, products, etc.)
│   │   ├── page.tsx       # List/index page
│   │   ├── actions.ts     # Server Actions for the module
│   │   ├── actions.test.ts # Tests for server actions
│   │   ├── [id]/          # Dynamic route for detail pages
│   │   │   ├── page.tsx   # Detail view
│   │   │   └── ...Button.tsx  # Client components for actions
│   │   └── new/           # Create new entity page
│   │       └── page.tsx
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Dashboard/home page
│   └── globals.css        # Global styles
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── barcode/           # Barcode/QR code components
│   └── Sidebar.tsx        # Main navigation sidebar
├── lib/
│   ├── supabase/
│   │   ├── client.ts      # Browser client
│   │   ├── server.ts      # Server client (uses cookies)
│   │   ├── middleware.ts  # Session management
│   │   └── public-server.ts # Public server client (no auth required)
│   └── utils.ts           # Utility functions (cn, etc.)
├── test/
│   └── setup.ts           # Vitest setup
└── middleware.ts          # Route protection & session refresh
i18n/
└── request.ts             # Locale detection (reads NEXT_LOCALE cookie)
messages/
├── th.json                # Thai translations
├── en.json                # English translations
└── ru.json                # Russian translations
```

### Key Architectural Patterns

#### 1. Server Actions Pattern

All data mutations use Next.js Server Actions (marked with `"use server"`). Each module has its own `actions.ts` file:

```typescript
// src/app/[module]/actions.ts
"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createEntity(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect("/login")

  // ... validation and database operations
  const { error } = await supabase.from("table").insert(data)

  if (error) {
    console.error("Error:", error)
    return redirect("/module?message=Error")
  }

  revalidatePath("/module")
  redirect("/module")
}
```

**Important**: Always call `revalidatePath()` after mutations to update the UI.

#### 2. Client Component Pattern

Interactive components that use hooks or event handlers must use `"use client"`:

```typescript
// src/app/[module]/[id]/DeleteButton.tsx
"use client"

import { useTranslations } from "next-intl"
import { deleteEntity } from "../actions"
import { Button } from "@/components/ui/button"

export default function DeleteButton({ id }: { id: number }) {
  const t = useTranslations("ModuleName")

  async function handleDelete() {
    if (confirm(t("confirmDelete"))) {
      await deleteEntity(id)
    }
  }

  return <Button onClick={handleDelete}>{t("delete")}</Button>
}
```

**Naming Convention**: Client components in detail pages follow patterns like:
- `DeleteButton.tsx` - Delete actions
- `EditForm.tsx` - Edit forms
- `AdjustStockDialog.tsx` - Dialog components
- `PrintButton.tsx` - Print actions

#### 3. Page Component Pattern (Next.js 15)

In Next.js 15, route params are now async:

```typescript
// src/app/[module]/[id]/page.tsx
type Props = {
  params: Promise<{ id: string }>
}

export default async function DetailPage(props: Props) {
  const params = await props.params
  const { id } = params
  const supabase = await createClient()
  const t = await getTranslations("ModuleName")

  // Use Promise.all for parallel data fetching
  const [entityRes, relatedRes] = await Promise.all([
    supabase.from("table").select("*").eq("id", id).single(),
    supabase.from("related").select("*"),
  ])

  if (entityRes.error || !entityRes.data) {
    notFound()
  }

  return <div>...</div>
}
```

#### 4. Supabase Client Usage

**Browser/Client Components**:
```typescript
import { createClient } from "@/lib/supabase/client"
const supabase = createClient()
```

**Server Components/Actions**:
```typescript
import { createClient } from "@/lib/supabase/server"
const supabase = await createClient() // Note: await is required
```

**Middleware**:
```typescript
import { updateSession } from "@/lib/supabase/middleware"
const { response, user } = await updateSession(request)
```

**Public Server (no auth)**:
```typescript
import { createClient } from "@/lib/supabase/public-server"
const supabase = await createClient() // For public pages like /public/asset/:id
```

#### 5. Database Relationships with Supabase

Supabase relationships work differently for one-to-one vs one-to-many:

```typescript
// One-to-Many: Returns array
const { data } = await supabase
  .from("products")
  .select("*, stock_movements (*)")
// product.stock_movements is StockMovement[]

// Many-to-One: Returns object (not array!)
const { data } = await supabase
  .from("invoices")
  .select("*, customers (*)")
// invoice.customers is Customer (singular object)

// With ordering on related table
const { data } = await supabase
  .from("products")
  .select("*, stock_movements (*)")
  .eq("id", id)
  .order("created_at", {
    referencedTable: "stock_movements",
    ascending: false,
  })
  .single()
```

**Important Gotcha**: To-one relationships (like `invoices.customer_id -> customers.id`) return a single object, not an array. Use `invoice.customers.name`, not `invoice.customers[0].name`.

#### 6. Internationalization (i18n)

The app uses `next-intl` with cookie-based locale switching:

**Server Components**:
```typescript
import { getTranslations } from "next-intl/server"
const t = await getTranslations("ModuleName")
return <h1>{t("title")}</h1>
```

**Client Components**:
```typescript
"use client"
import { useTranslations } from "next-intl"
const t = useTranslations("ModuleName")
```

**Translation Files Structure**:
```json
// messages/th.json or messages/en.json
{
  "ModuleName": {
    "title": "Title text",
    "description": "Description text"
  }
}
```

Locale is stored in the `NEXT_LOCALE` cookie (default: "th"). Translation files are in `messages/{locale}.json`.

#### 7. Authentication & Route Protection

- Middleware (`src/middleware.ts`) protects all routes except `/login` and `/public/*`
- Session is refreshed on every request via `updateSession()`
- Unauthenticated users are redirected to `/login`
- Public asset pages (e.g., `/public/asset/123`) are accessible without auth

#### 8. Barcode & QR Code Generation

The app uses multiple libraries for barcode/QR functionality:

**Generate Barcode** (react-barcode):
```typescript
import Barcode from "react-barcode"
<Barcode value={product.barcode} />
```

**Generate QR Code** (qrcode.react):
```typescript
import { QRCodeSVG } from "qrcode.react"
<QRCodeSVG value={url} size={200} />
```

**Scan QR Code** (html5-qrcode):
```typescript
import { Html5QrcodeScanner } from "html5-qrcode"
// See src/app/scanner/ for implementation
```

#### 9. Database Schema Notes

- Invoice numbering follows pattern: `INVNo{YY}{NNN}{INITIALS}` (e.g., `INVNo25001PW`)
- Relationships use Supabase foreign keys (e.g., `invoices.customer_id -> customers.id`)
- JSON columns store complex data (e.g., `invoice.items` is `InvoiceItem[]`)
- SQL migration files are in the root directory (e.g., `database-*.sql`)
- RPC functions handle complex operations (e.g., `adjust_inventory_in_warehouse`, `transfer_stock`)

## Development Guidelines

### When Adding New Features

1. **Create Server Actions**: Add to `src/app/[module]/actions.ts` with `"use server"` directive
2. **Write Tests**: Create `actions.test.ts` alongside your actions file
3. **Add i18n Keys**: Update `messages/th.json` and `messages/en.json` (and `messages/ru.json` if needed)
4. **Use Type Safety**: Define TypeScript types for database entities and form data
5. **Revalidate Paths**: Always call `revalidatePath()` after mutations
6. **Handle Errors**: Always check for errors from Supabase and provide user feedback

### Testing Patterns

Tests use Vitest with mocked Supabase client:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock Supabase
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "123" } },
        error: null
      })
    },
  })),
}))

// Mock Next.js cache functions
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}))
```

### Common Pitfalls

- **Cookies in Server Components**: `await cookies()` must be called before using cookie store (Next.js 15 requirement)
- **Supabase Client**: Use `await createClient()` in server code (not `createClient()`)
- **Revalidation**: Forgetting `revalidatePath()` causes stale data in the UI
- **Types**: Supabase to-one relationships return objects (not arrays)
- **Async Params**: In Next.js 15, params must be awaited: `const params = await props.params`
- **Client Directive**: Components using hooks or browser APIs need `"use client"` directive
- **Error Handling**: Always check `error` from Supabase operations before using `data`

### Docker Deployment

The app uses multi-stage Docker builds with `output: "standalone"` in `next.config.ts`:

```bash
docker build -t next-crm .
docker run -p 3000:3000 next-crm
```

Ensure environment variables are set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Module Organization

The app is organized by business modules:

- **customers**: Customer management (CRM)
- **employees**: Employee/HR management
- **products**: Product catalog with barcode/QR codes
- **warehouses**: Warehouse/location management
- **invoices**: Sales invoices with payment tracking
- **quotations**: Quote/estimate creation
- **cash-bills**: Cash receipt management
- **purchase-orders**: Supplier purchase orders
- **suppliers**: Supplier management
- **stock-adjustments**: Inventory adjustments and transfers
- **assets**: Office asset tracking with QR codes
- **responsible-persons**: Contact persons for customers
- **scanner**: QR/Barcode scanning interface
- **reports**: Business reports (inventory valuation, outstanding invoices)

Each module follows the same pattern: list page, detail page, actions, and tests.

## Key Files Reference

- `src/middleware.ts` - Authentication and session management
- `src/lib/supabase/server.ts` - Server-side Supabase client
- `src/lib/supabase/client.ts` - Browser Supabase client
- `src/lib/supabase/middleware.ts` - Session update logic
- `src/lib/supabase/public-server.ts` - Public pages client (no auth)
- `src/test/setup.ts` - Vitest configuration and mocks
- `i18n/request.ts` - Locale detection logic
- `next.config.ts` - Next.js configuration
- `vitest.config.mts` - Vitest configuration
