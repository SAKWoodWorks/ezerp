# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**EZ-ERP** is a modern CRM and ERP system built for internal use at SAK Woodworks. The application manages customers, sales, inventory, employees, assets, and various business operations. It supports Thai, English, and Russian languages.

**Important**: This software is proprietary and developed for internal use only. Do not modify, distribute, or use outside of SAK Woodworks without authorization.

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19
- **Database & Auth**: Supabase (PostgreSQL)
- **Language**: TypeScript
- **UI**: shadcn/ui components + Tailwind CSS v4
- **i18n**: next-intl v4 (cookie-based locale switching)
- **Testing**: Vitest + happy-dom
- **PDF Generation**: jsPDF, pdf-lib, html2canvas
- **Printing**: react-to-print
- **QR Codes**: qrcode.react
- **Barcodes**: react-barcode, html5-qrcode
- **Spreadsheets**: xlsx (Excel import/export)

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

  const { error } = await supabase.from("table").insert(data)

  if (error) {
    console.error("Error:", error)
    return redirect("/module?message=Error")
  }

  revalidatePath("/module")
  redirect("/module")
}
```

Always call `revalidatePath()` after mutations. There is also a shared `src/components/actions.ts` for cross-module actions like `logout()`.

**Important**: Server Actions have a 1MB request limit and 64KB default for inline forms. For file uploads or large data processing, use API Routes instead (see API Routes vs Server Actions pattern below).

#### 1B. API Routes vs Server Actions

Use **Server Actions** for:
- Form submissions with small payloads (< 64KB)
- Simple CRUD operations
- Cases requiring automatic revalidation/redirection

Use **API Routes** for:
- File uploads (FormData)
- Large data processing
- External webhooks
- Custom response formats

```typescript
// API Route example: src/app/api/[module]/import/route.ts
import { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: "Authentication required" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File
  
  // Process file...
  
  return Response.json({ success: true, count: results.length })
}
```

#### 2. Client Component Pattern

Interactive components that use hooks or event handlers must use `"use client"`. Naming conventions for client components in detail pages:
- `DeleteButton.tsx` - Delete actions
- `EditForm.tsx` - Edit forms
- `AdjustStockDialog.tsx` - Dialog components
- `PrintButton.tsx` - Print actions

#### 3. Page Component Pattern (Next.js 15)

Both route params and search params are async in Next.js 15:

```typescript
type Props = { 
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function DetailPage(props: Props) {
  const params = await props.params
  const searchParams = await props.searchParams
  const { id } = params
  const supabase = await createClient()
  const t = await getTranslations("ModuleName")

  // Use Promise.all for parallel data fetching
  const [entityRes, relatedRes] = await Promise.all([
    supabase.from("table").select("*").eq("id", id).single(),
    supabase.from("related").select("*"),
  ])

  if (entityRes.error || !entityRes.data) notFound()

  return <div>...</div>
}
```

For list pages with pagination or filters, always parse and validate search params:

```typescript
type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ListPage(props: Props) {
  const searchParams = await props.searchParams
  
  // Parse and validate pagination parameters
  const page = Math.max(1, parseInt(typeof searchParams.page === 'string' ? searchParams.page : '1') || 1)
  const validLimits = [25, 50, 100, 200]
  const parsedLimit = parseInt(typeof searchParams.limit === 'string' ? searchParams.limit : '50') || 50
  const limit = validLimits.includes(parsedLimit) ? parsedLimit : 50
}
```

#### 4. Supabase Client Usage

| Context | Import | Instantiation |
|---|---|---|
| Server Components / Actions | `@/lib/supabase/server` | `await createClient()` |
| Client Components | `@/lib/supabase/client` | `createClient()` |
| Middleware | `@/lib/supabase/middleware` | `await updateSession(request)` |
| Public pages (no auth) | `@/lib/supabase/public-server` | `await createClient()` |

#### 5. Database Relationships with Supabase

```typescript
// One-to-Many → returns array
supabase.from("products").select("*, stock_movements (*)")
// product.stock_movements is StockMovement[]

// Many-to-One → returns OBJECT, not array!
supabase.from("invoices").select("*, customers (*)")
// invoice.customers is Customer — use invoice.customers.name, NOT invoice.customers[0].name

// Ordering a related table
supabase.from("products")
  .select("*, stock_movements (*)")
  .order("created_at", { referencedTable: "stock_movements", ascending: false })
  .single()
```

#### 6. Internationalization (i18n)

Locale is stored in the `NEXT_LOCALE` cookie (default: "th"). Translation files are in `messages/{locale}.json` (th, en, ru).

```typescript
// Server Component
import { getTranslations } from "next-intl/server"
const t = await getTranslations("ModuleName")

// Client Component
import { useTranslations } from "next-intl"
const t = useTranslations("ModuleName")
```

Translation file structure:
```json
{ "ModuleName": { "title": "Title text" } }
```

When adding new features, update all three translation files: `messages/th.json`, `messages/en.json`, and `messages/ru.json`.

#### 7. Authentication & Route Protection

- `src/middleware.ts` protects all routes except `/login` and `/public/*`
- Session is refreshed on every request via `updateSession()`
- Public asset pages (`/public/asset/[id]`) are accessible without auth

#### 8. RBAC / Permissions

Permission logic lives in `src/lib/permissions.ts` (role/permission definitions) and `src/lib/permissions-utils.ts` (checking utilities). Use these when gating features by user role.

#### 9. Database Schema Notes

- Invoice numbering: `INVNo{YY}{NNN}{INITIALS}` (e.g., `INVNo25001PW`)
- Shipment numbering: `IMP{YY}{NNNN}` for imports, `EXP{YY}{NNNN}` for exports
- JSON columns store complex data (e.g., `invoice.items` is `InvoiceItem[]`)
- SQL migration files are in the root directory (`database-*.sql`)
- RPC functions handle complex operations (e.g., `adjust_inventory_in_warehouse`, `transfer_stock`)
- **Per-warehouse stock**: `product_inventories` table (`product_id`, `warehouse_id`, `quantity`) — unique on `(product_id, warehouse_id)`. `products.stock_quantity` is the grand total across all warehouses.
- **Warehouse IDs**: 1 = Pathum Thani, 2 = Pathum Thani 39, 3 = Chanthaburi, 4 = Chiang Mai
- **Grade stock**: `product_stock_by_grade` table (`product_id`, `warehouse_id`, `grade_a`, `cca_ready`, `grade_cca`, `grade_b`, `synced_at`) — synced from Google Sheets via Apps Script
- **Products price column**: use `price` — there is no `selling_price` column
- **POS payment slips**: uploaded to Supabase Storage bucket `payment-slips`; URL stored in `cash_bills.payment_slip_url`

#### 10. Analytics RPC Functions

The analytics module (`src/app/reports/analytics/`) uses Supabase RPC:

```typescript
const { data, error } = await supabase.rpc('get_sales_by_period', {
  start_date: '2025-01-01',
  end_date: '2025-12-31',
  period_type: 'month'
})
```

Key functions (defined in `database-advanced-analytics.sql`): `get_sales_by_period`, `get_top_customers`, `get_customer_lifetime_value`, `get_product_performance`, `get_stock_turnover_rate`, `get_profit_loss_statement`, `get_accounts_receivable_aging`, `get_shipment_analytics`, `get_customs_clearance_stats`.

When mocking tests that use `.rpc()`, include `rpc` in the mock (see Testing Patterns below).

#### 11. Server-Side Pagination Pattern

Server-side pagination using URL search parameters and Supabase `.range()` queries:

```typescript
// Server Page Component
export default async function ListPage(props: Props) {
  const searchParams = await props.searchParams
  const page = Math.max(1, parseInt(searchParams.page || '1') || 1)
  const limit = [25, 50, 100, 200].includes(Number(searchParams.limit)) ? Number(searchParams.limit) : 50

  // Calculate pagination range
  const start = (page - 1) * limit
  const end = start + limit - 1

  // Get total count (separate query for accuracy)
  const { count: totalCount } = await supabase
    .from("table")
    .select("*", { count: 'exact', head: true })

  const totalPages = Math.max(1, Math.ceil((totalCount || 0) / limit))

  // Handle page out of bounds
  if (page > totalPages && totalCount > 0) {
    const params = new URLSearchParams()
    params.set('page', totalPages.toString())
    if (limit !== 50) params.set('limit', limit.toString())
    redirect(`/route?${params.toString()}`)
  }

  // Fetch paginated data
  const { data } = await supabase
    .from("table")
    .select("*")
    .order("created_at", { ascending: false })
    .range(start, end)

  return (
    <ClientComponent
      initialData={data || []}
      pagination={{ currentPage: page, pageSize: limit, totalCount: totalCount || 0, totalPages }}
    />
  )
}
```

**URL Navigation**: Use `useRouter().push()` with `URLSearchParams` to preserve existing query parameters:

```typescript
// Client Component
const handlePageChange = (page: number) => {
  const params = new URLSearchParams(searchParams)
  params.set('page', page.toString())
  router.push(`${pathname}?${params.toString()}`)
}
```

### Testing Patterns

Tests use Vitest with mocked Supabase client:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest"

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
        error: null,
      }),
    },
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
  })),
}))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({ redirect: vi.fn() }))
```

#### Testing Internationalized Components

For components using `next-intl`, mock the translation functions:

```typescript
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, any>) => {
    // Handle interpolated values
    if (key === 'showing' && values) {
      return `Showing ${values.start}-${values.end} of ${values.total} customers`
    }
    if (key === 'goToPage' && values) {
      return `Go to page ${values.number}`
    }
    // Return key as fallback
    return key
  },
}))
```

#### Testing Range Queries

When testing pagination, mock the `.range()` method:

```typescript
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
  })),
}
```

### Common Pitfalls

- **Supabase Client**: Always `await createClient()` in server code
- **Async Params**: `const params = await props.params` (Next.js 15 requirement)
- **Async SearchParams**: `const searchParams = await props.searchParams` (Next.js 15 requirement)
- **SearchParams Validation**: Always validate and sanitize URL search parameters before use
- **Pagination Boundaries**: Check if requested page exceeds total pages and redirect appropriately
- **Revalidation**: Forgetting `revalidatePath()` causes stale UI data
- **Relationship types**: To-one relationships return objects, not arrays
- **Cookies**: `await cookies()` must be called before using cookie store (Next.js 15)
- **Client Directive**: Components using hooks or browser APIs need `"use client"`
- **Server Action Limits**: 64KB limit for inline forms, 1MB for all Server Actions - use API routes for file uploads
- **Range Query Order**: Always include `.order()` before `.range()` for consistent pagination results
- **RPC in mocks**: Include `rpc: vi.fn()` at the client level, not inside `from()`
- **Vitest version**: Locked at v3.2.3 — do NOT upgrade to v4 (rolldown ESM compat breaks with Node.js)
- **`@vitejs/plugin-react`**: Locked at v4.3.4 for same reason
- **Import Syntax Issues**: BarcodeScanner component uses default export; lucide-react icons don't have "Icon" suffix (use `Search` not `SearchIcon`)

## Module Organization

| Module | Path | Description |
|---|---|---|
| customers | `/customers` | Customer CRM management |
| employees | `/employees` | Employee HR (incl. `/leave-history` sub-route) |
| products | `/products` | Product catalog with barcode/QR |
| warehouses | `/warehouses` | Warehouse management + `/summary` dashboard |
| invoices | `/invoices` | Sales invoices with payment tracking |
| quotations | `/quotations` | Quote/estimate creation |
| cash-bills | `/cash-bills` | Cash receipt management |
| purchase-orders | `/purchase-orders` | Supplier purchase orders |
| suppliers | `/suppliers` | Supplier management |
| stock-adjustments | `/stock-adjustments` | Inventory adjustments and transfers |
| assets | `/assets` | Office asset tracking with QR codes |
| responsible-persons | `/responsible-persons` | Contact persons for customers |
| scanner | `/scanner` | QR/Barcode scanning interface |
| import-shipments | `/import-shipments` | Pine wood imports from Russia (CIF, `IMP{YY}{NNNN}`) |
| export-shipments | `/export-shipments` | Teak wood exports to international customers (FOB, `EXP{YY}{NNNN}`) |
| settings | `/settings` | Application settings |
| pos | `/pos` | Full-screen POS terminal — cart, barcode scan, cash/transfer/QR payment, slip upload |
| reports | `/reports` | Inventory valuation, outstanding invoices |
| analytics | `/reports/analytics` | Advanced analytics via RPC functions |
| stock-by-grade | `/reports/stock-by-grade` | Per-grade stock synced from Google Sheets |
| public assets | `/public/asset/[id]` | Public QR-accessible asset view (no auth) |

### Import/Export Shipment Details

Both shipment modules support document attachments, lifecycle status tracking, warehouse assignment, stock integration, and multiple currencies (default: USD).

**Import** (Pine from Russia): tracks vessel/container details, customs clearance, total landed cost (freight + insurance + customs duty).

**Export** (Teak to international): tracks export permits, packing/shipping/delivery dates, links to customer invoices.

### API Routes

API routes complement Server Actions for specific use cases:

| Route | Purpose | Use Case |
|-------|---------|-----------|
| `/api/customers/import` | Customer CSV/Excel import | File uploads, large data processing |
| `/auth/callback` | Supabase auth callback | OAuth redirects |

Use API routes when Server Actions hit size limits or need custom response formats.

## Key Files Reference

- `src/middleware.ts` - Auth and session management
- `src/lib/supabase/server.ts` - Server-side Supabase client
- `src/lib/supabase/client.ts` - Browser Supabase client
- `src/lib/supabase/public-server.ts` - Public pages client (no auth)
- `src/lib/permissions.ts` - RBAC role/permission definitions
- `src/lib/permissions-utils.ts` - Permission checking utilities
- `src/components/actions.ts` - Shared server actions (e.g., logout)
- `src/components/Sidebar.tsx` - Main navigation (4 sections: Main, Sales, Inventory, Office)
- `src/test/setup.ts` - Vitest configuration and global mocks
- `i18n/request.ts` - Locale detection (reads `NEXT_LOCALE` cookie)
- `next.config.ts` - Next.js config (`output: "standalone"`, Supabase image hostname)
- `vitest.config.mts` - Vitest config (happy-dom, coverage via v8)
- `database-import-export-module.sql` - Import/export shipments schema
- `database-advanced-analytics.sql` - Analytics RPC functions
- `database-stock-by-grade.sql` - `product_stock_by_grade` table schema
- `google-apps-script/sync-stock.gs` - Google Sheets → Supabase stock sync (onChange trigger, upserts `product_stock_by_grade`, `product_inventories`, and `products.stock_quantity`). Requires Script Properties: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (legacy JWT `eyJ...` format — new `sb_secret_` keys don't work from Apps Script), `WAREHOUSE_PT_ID`, `WAREHOUSE_CT_ID`, `WAREHOUSE_CM_ID`
- `src/app/pos/` - POS terminal (POSTerminal.tsx, ProductSearch.tsx, CartPanel.tsx, PaymentModal.tsx)
- `src/app/customers/components/PaginationControls.tsx` - Reusable pagination component (serves as pattern for other paginated lists)

## Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Docker Deployment

### Local Development

```bash
docker build -t next-crm .
docker run -p 3000:3000 next-crm
```

### Production with Docker Compose (Nginx + App)

The application includes Docker Compose configuration for production deployment with Nginx reverse proxy:

```bash
# Build and start services
docker-compose build --no-cache
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Configuration:**
- **App Container**: Next.js app on port 3000 (internal)
- **Nginx Container**: Reverse proxy on port 8002 (external)
- **Network**: Custom bridge network for container communication

**Files:**
- `docker-compose.yml` - Main production configuration
- `nginx.conf` - Nginx reverse proxy configuration  
- `deploy.sh` - Automated deployment script for servers
- `.env.local` - Required environment variables

Uses multi-stage build with `output: "standalone"` in `next.config.ts`.

### Deployment Scripts

- **`deploy.sh`** - One-click deployment script for Digital Ocean servers
  - Handles missing components, Docker cleanup, and build process
  - Checks for `.env.local` file and creates missing directories
  - Includes health checks and firewall configuration

- **`fix-build.sh`** - Fixes common Docker build issues
  - Removes obsolete version from docker-compose.yml
  - Creates missing BarcodeScanner component
  - Updates Dockerfile with dependency fixes

**Common Build Issues:**

**Tailwind CSS v4 Native Binding Errors:**

- **Problem**: `Cannot find native binding` error with `@tailwindcss/oxide`
- **Root cause**: Tailwind CSS v4 uses Rust-based native modules that need compilation
- **Solution**: Dockerfile uses `node:18-slim` (not Alpine) + Rust toolchain + system dependencies
- **Dependencies needed**: `python3`, `make`, `g++`, `curl`, and Rust via rustup

**Import Syntax Issues:**

- **BarcodeScanner**: Use default import `import BarcodeScanner from '@/components/barcode/BarcodeScanner'`
- **lucide-react icons**: No "Icon" suffix (use `Search` not `SearchIcon`, `RefreshCw` not `Sync`)
- **Missing components**: Auto-created by deployment scripts, but check props interface matches usage

**Docker Build Troubleshooting:**

```bash
# If build fails, clean everything and rebuild
docker-compose down
docker system prune -f
docker-compose build --no-cache
docker-compose up -d
```
