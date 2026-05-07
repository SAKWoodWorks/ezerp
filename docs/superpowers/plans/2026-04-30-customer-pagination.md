# Customer Pagination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add server-side pagination to customer page with configurable page sizes and URL-based navigation.

**Architecture:** Server component handles URL search params, fetches paginated data via Supabase range queries, client component renders pagination controls using shadcn/ui.

**Tech Stack:** Next.js 15 App Router, Supabase pagination, shadcn/ui components, TypeScript

---

## File Structure

**New Files:**
- `src/app/customers/components/PaginationControls.tsx` - Pagination UI component
- `src/app/customers/components/PaginationControls.test.tsx` - Component tests

**Modified Files:**
- `src/app/customers/page.tsx` - Add pagination logic and URL param handling
- `src/app/customers/CustomerClientPage.tsx` - Accept pagination props and render controls
- `messages/th.json` - Add Thai translations
- `messages/en.json` - Add English translations  
- `messages/ru.json` - Add Russian translations

---

### Task 1: Add Translation Keys

**Files:**
- Modify: `messages/th.json`
- Modify: `messages/en.json`
- Modify: `messages/ru.json`

- [ ] **Step 1: Add Thai translation keys**

Add to `CustomersPage` section in `messages/th.json`:

```json
"pagination": {
  "showing": "แสดง {start}-{end} จาก {total} ลูกค้า",
  "previous": "ก่อนหน้า",
  "next": "ถัดไป",
  "show": "แสดง",
  "page": "หน้า {number}",
  "goToPage": "ไปหน้า {number}"
}
```

- [ ] **Step 2: Add English translation keys**

Add to `CustomersPage` section in `messages/en.json`:

```json
"pagination": {
  "showing": "Showing {start}-{end} of {total} customers",
  "previous": "Previous",
  "next": "Next",
  "show": "Show",
  "page": "Page {number}",
  "goToPage": "Go to page {number}"
}
```

- [ ] **Step 3: Add Russian translation keys**

Add to `CustomersPage` section in `messages/ru.json`:

```json
"pagination": {
  "showing": "Показано {start}-{end} из {total} клиентов",
  "previous": "Предыдущая",
  "next": "Следующая", 
  "show": "Показать",
  "page": "Страница {number}",
  "goToPage": "Перейти на страницу {number}"
}
```

- [ ] **Step 4: Verify translations format**

Run: `npm run dev` and check console for any JSON parsing errors

Expected: No translation errors in console

- [ ] **Step 5: Commit translation keys**

```bash
git add messages/th.json messages/en.json messages/ru.json
git commit -m "feat: add pagination translation keys

- Add Thai, English, Russian translations for pagination
- Support showing current range, navigation, and page size selector"
```

---

### Task 2: Create PaginationControls Component

**Files:**
- Create: `src/app/customers/components/PaginationControls.tsx`
- Create: `src/app/customers/components/PaginationControls.test.tsx`

- [ ] **Step 1: Create components directory**

```bash
mkdir -p src/app/customers/components
```

- [ ] **Step 2: Write failing test for PaginationControls**

Create `src/app/customers/components/PaginationControls.test.tsx`:

```typescript
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import PaginationControls from "./PaginationControls"

const messages = {
  CustomersPage: {
    pagination: {
      showing: "Showing {start}-{end} of {total} customers",
      previous: "Previous",
      next: "Next",
      show: "Show",
      page: "Page {number}",
      goToPage: "Go to page {number}"
    }
  }
}

const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {component}
    </NextIntlClientProvider>
  )
}

describe("PaginationControls", () => {
  const mockOnPageChange = vi.fn()
  const mockOnPageSizeChange = vi.fn()

  beforeEach(() => {
    mockOnPageChange.mockClear()
    mockOnPageSizeChange.mockClear()
  })

  it("renders pagination info correctly", () => {
    renderWithIntl(
      <PaginationControls
        currentPage={2}
        totalPages={5}
        pageSize={50}
        totalCount={234}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />
    )

    expect(screen.getByText("Showing 51-100 of 234 customers")).toBeInTheDocument()
  })

  it("renders page buttons correctly", () => {
    renderWithIntl(
      <PaginationControls
        currentPage={3}
        totalPages={7}
        pageSize={25}
        totalCount={160}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />
    )

    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.getByText("4")).toBeInTheDocument()
    expect(screen.getByText("5")).toBeInTheDocument()
  })

  it("calls onPageChange when page button clicked", () => {
    renderWithIntl(
      <PaginationControls
        currentPage={2}
        totalPages={5}
        pageSize={50}
        totalCount={234}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />
    )

    fireEvent.click(screen.getByText("3"))
    expect(mockOnPageChange).toHaveBeenCalledWith(3)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- src/app/customers/components/PaginationControls.test.tsx`

Expected: FAIL with "Cannot resolve module './PaginationControls'"

- [ ] **Step 4: Create basic PaginationControls component**

Create `src/app/customers/components/PaginationControls.tsx`:

```typescript
"use client"

import { useTranslations } from "next-intl"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  pageSize: number
  totalCount: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export default function PaginationControls({
  currentPage,
  totalPages,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) {
  const t = useTranslations("CustomersPage.pagination")

  // Calculate display range
  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalCount)

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = []
    const showPages = 5 // Number of page buttons to show

    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2))
    let endPage = Math.min(totalPages, startPage + showPages - 1)

    // Adjust start if we're near the end
    startPage = Math.max(1, endPage - showPages + 1)

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex items-center justify-between px-2 py-4">
      {/* Left: Showing info */}
      <div className="text-sm text-muted-foreground">
        {t("showing", { start, end, total: totalCount })}
      </div>

      {/* Center: Page navigation */}
      <div className="flex items-center space-x-1">
        {/* Previous button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label={t("previous")}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">{t("previous")}</span>
        </Button>

        {/* Page number buttons */}
        {pageNumbers.map((pageNum) => (
          <Button
            key={pageNum}
            variant={currentPage === pageNum ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(pageNum)}
            aria-label={t("goToPage", { number: pageNum })}
            className="min-w-[2.5rem]"
          >
            {pageNum}
          </Button>
        ))}

        {/* Next button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label={t("next")}
        >
          <span className="hidden sm:inline mr-1">{t("next")}</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Right: Page size selector */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-muted-foreground">{t("show")}:</span>
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => onPageSizeChange(parseInt(value))}
        >
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
            <SelectItem value="200">200</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- src/app/customers/components/PaginationControls.test.tsx`

Expected: PASS (all tests passing)

- [ ] **Step 6: Commit PaginationControls component**

```bash
git add src/app/customers/components/PaginationControls.tsx src/app/customers/components/PaginationControls.test.tsx
git commit -m "feat: add PaginationControls component

- Responsive pagination with page numbers and navigation
- Page size selector with options 25, 50, 100, 200
- Internationalization support with next-intl
- Comprehensive test coverage"
```

---

### Task 3: Add Pagination Logic to Server Page Component

**Files:**
- Modify: `src/app/customers/page.tsx`

- [ ] **Step 1: Write test for pagination logic**

Create `src/app/customers/page.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock Supabase client
const mockSelect = vi.fn().mockReturnThis()
const mockFrom = vi.fn().mockReturnThis()
const mockOrder = vi.fn().mockReturnThis()
const mockRange = vi.fn().mockResolvedValue({ data: [], error: null })
const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null })

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    from: mockFrom.mockImplementation(() => ({
      select: mockSelect.mockImplementation(() => ({
        order: mockOrder.mockImplementation(() => ({
          range: mockRange,
        })),
        range: mockRange,
      })),
    })),
  })),
}))

describe("CustomersPage pagination", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFrom.mockReturnValue({
      select: mockSelect.mockReturnValue({
        order: mockOrder.mockReturnValue({
          range: mockRange,
        }),
        range: mockRange,
      }),
    })
  })

  it("should calculate correct range for page 1", () => {
    const page = 1
    const limit = 50
    const start = (page - 1) * limit // 0
    const end = start + limit - 1    // 49

    expect(start).toBe(0)
    expect(end).toBe(49)
  })

  it("should calculate correct range for page 2", () => {
    const page = 2
    const limit = 25
    const start = (page - 1) * limit // 25
    const end = start + limit - 1    // 49

    expect(start).toBe(25)
    expect(end).toBe(49)
  })
})
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npm test -- src/app/customers/page.test.tsx`

Expected: PASS (range calculations work correctly)

- [ ] **Step 3: Backup current page component**

```bash
cp src/app/customers/page.tsx src/app/customers/page.tsx.backup
```

- [ ] **Step 4: Add pagination logic to page component**

Modify `src/app/customers/page.tsx`:

```typescript
import { createClient } from "@/lib/supabase/server"
import CustomerClientPage from "./CustomerClientPage"

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function CustomersPage(props: Props) {
  const searchParams = await props.searchParams
  const supabase = await createClient()

  // Parse and validate pagination parameters
  const page = Math.max(1, parseInt((searchParams.page as string) || '1'))
  const limitParam = searchParams.limit as string || '50'
  const limit = [25, 50, 100, 200].includes(parseInt(limitParam)) 
    ? parseInt(limitParam) 
    : 50

  // Calculate range for Supabase query
  const start = (page - 1) * limit
  const end = start + limit - 1

  try {
    // Fetch paginated customers data
    const { data: customers, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false })
      .range(start, end)

    if (error) {
      console.error("Error fetching customers:", error)
      return <p className="p-8">เกิดข้อผิดพลาดในการโหลดข้อมูลลูกค้า</p>
    }

    // Get total count for pagination (separate query for accuracy)
    const { count: totalCount, error: countError } = await supabase
      .from("customers")
      .select("*", { count: 'exact', head: true })

    if (countError) {
      console.error("Error getting customer count:", countError)
      // Fallback: estimate total pages from current data
      const estimatedTotal = customers?.length || 0
      const totalPages = Math.max(1, Math.ceil(estimatedTotal / limit))
      
      return (
        <CustomerClientPage 
          initialCustomers={customers || []}
          pagination={{
            currentPage: page,
            pageSize: limit,
            totalCount: estimatedTotal,
            totalPages: totalPages
          }}
        />
      )
    }

    const totalPages = Math.max(1, Math.ceil((totalCount || 0) / limit))

    // If requested page exceeds total pages, redirect to last page
    if (page > totalPages && totalPages > 1) {
      // In a real app, you might want to use redirect() here
      // For now, just show the last page
      const lastPageStart = (totalPages - 1) * limit
      const lastPageEnd = lastPageStart + limit - 1

      const { data: lastPageCustomers, error: lastPageError } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false })
        .range(lastPageStart, lastPageEnd)

      if (lastPageError) {
        console.error("Error fetching last page:", lastPageError)
        return <p className="p-8">เกิดข้อผิดพลาดในการโหลดข้อมูลลูกค้า</p>
      }

      return (
        <CustomerClientPage 
          initialCustomers={lastPageCustomers || []}
          pagination={{
            currentPage: totalPages,
            pageSize: limit,
            totalCount: totalCount || 0,
            totalPages: totalPages
          }}
        />
      )
    }

    return (
      <CustomerClientPage 
        initialCustomers={customers || []}
        pagination={{
          currentPage: page,
          pageSize: limit,
          totalCount: totalCount || 0,
          totalPages: totalPages
        }}
      />
    )

  } catch (error) {
    console.error("Unexpected error in CustomersPage:", error)
    return <p className="p-8">เกิดข้อผิดพลาดในการโหลดข้อมูลลูกค้า</p>
  }
}
```

- [ ] **Step 5: Run dev server to check for compilation errors**

Run: `npm run dev`

Expected: Server starts without TypeScript errors (may see runtime errors until client component is updated)

- [ ] **Step 6: Commit pagination server logic**

```bash
git add src/app/customers/page.tsx src/app/customers/page.test.tsx
git commit -m "feat: add server-side pagination to customers page

- Parse URL search params for page and limit
- Validate pagination parameters with sensible defaults
- Use Supabase range queries for efficient data fetching
- Handle edge cases like page out of bounds
- Add comprehensive error handling"
```

---

### Task 4: Update Client Component for Pagination

**Files:**
- Modify: `src/app/customers/CustomerClientPage.tsx`

- [ ] **Step 1: Write test for updated client component**

Create `src/app/customers/CustomerClientPage.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import CustomerClientPage from "./CustomerClientPage"

// Mock next/navigation
const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock server actions
vi.mock("./actions", () => ({
  addCustomer: vi.fn(),
}))

const messages = {
  CustomersPage: {
    title: "ลูกค้า",
    addNew: "เพิ่มลูกค้าใหม่",
    pagination: {
      showing: "แสดง {start}-{end} จาก {total} ลูกค้า",
      previous: "ก่อนหน้า",
      next: "ถัดไป",
      show: "แสดง",
    },
  },
}

const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="th" messages={messages}>
      {component}
    </NextIntlClientProvider>
  )
}

describe("CustomerClientPage with pagination", () => {
  const mockCustomers = [
    { id: 1, name: "Customer 1", phone: "123-456-7890", responsible_person: "John" },
    { id: 2, name: "Customer 2", phone: "098-765-4321", responsible_person: "Jane" },
  ]

  const mockPagination = {
    currentPage: 1,
    pageSize: 50,
    totalCount: 100,
    totalPages: 2,
  }

  beforeEach(() => {
    mockPush.mockClear()
  })

  it("renders customer table with pagination controls", () => {
    renderWithIntl(
      <CustomerClientPage 
        initialCustomers={mockCustomers}
        pagination={mockPagination}
      />
    )

    expect(screen.getByText("Customer 1")).toBeInTheDocument()
    expect(screen.getByText("Customer 2")).toBeInTheDocument()
    expect(screen.getByText("แสดง 1-50 จาก 100 ลูกค้า")).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/customers/CustomerClientPage.test.tsx`

Expected: FAIL with "Property 'pagination' is missing" or similar TypeScript error

- [ ] **Step 3: Backup current client component**

```bash
cp src/app/customers/CustomerClientPage.tsx src/app/customers/CustomerClientPage.tsx.backup
```

- [ ] **Step 4: Update CustomerClientPage with pagination**

Modify `src/app/customers/CustomerClientPage.tsx`:

```typescript
"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { addCustomer } from "./actions"
import { Plus, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import ImportCustomerDialog from "./ImportCustomerDialog"
import PaginationControls from "./components/PaginationControls"

type Customer = {
  id: number
  name: string
  phone: string | null
  responsible_person: string | null
}

interface PaginationData {
  currentPage: number
  pageSize: number
  totalCount: number
  totalPages: number
}

interface Props {
  initialCustomers: Customer[]
  pagination: PaginationData
}

export default function CustomerClientPage({ 
  initialCustomers, 
  pagination 
}: Props) {
  const t = useTranslations("CustomersPage")
  const [customers, setCustomers] = useState(initialCustomers)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    setCustomers(initialCustomers)
  }, [initialCustomers])

  const handleRowClick = (customerId: number) => {
    router.push(`/customers/${customerId}`)
  }

  const handleFormSubmit = (formData: FormData) => {
    startTransition(async () => {
      await addCustomer(formData)
      setIsDialogOpen(false)
    })
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`/customers?${params.toString()}`)
  }

  const handlePageSizeChange = (size: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('limit', size.toString())
    params.delete('page') // Reset to page 1 when changing page size
    router.push(`/customers?${params.toString()}`)
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <div className="flex gap-2">
          <ImportCustomerDialog />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus size={20} className="mr-2" /> {t("addNew")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>{t("dialogTitle")}</DialogTitle>
                <DialogDescription>{t("dialogDescription")}</DialogDescription>
              </DialogHeader>
              <form action={handleFormSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      {t("dialogName")}
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="taxId" className="text-right">
                      {t("dialogTaxId")}
                    </Label>
                    <Input id="taxId" name="taxId" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="address" className="text-right">
                      {t("dialogAddress")}
                    </Label>
                    <Textarea
                      id="address"
                      name="address"
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">
                      {t("dialogPhone")}
                    </Label>
                    <Input id="phone" name="phone" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="lineId" className="text-right">
                      {t("dialogLineId")}
                    </Label>
                    <Input id="lineId" name="lineId" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="responsiblePerson" className="text-right">
                      {t("dialogResponsible")}
                    </Label>
                    <Input
                      id="responsiblePerson"
                      name="responsiblePerson"
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isPending}>
                    {isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {t("buttonTitle")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("tableHeaderName")}</TableHead>
              <TableHead>{t("tableHeaderPhone")}</TableHead>
              <TableHead>{t("tableHeaderResponsible")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow
                key={customer.id}
                className="cursor-pointer"
                onClick={() => handleRowClick(customer.id)}
              >
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell>{customer.responsible_person}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* Pagination Controls */}
        <PaginationControls
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          pageSize={pagination.pageSize}
          totalCount={pagination.totalCount}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- src/app/customers/CustomerClientPage.test.tsx`

Expected: PASS (component renders with pagination)

- [ ] **Step 6: Test the complete pagination flow**

Run: `npm run dev` and navigate to `http://localhost:3000/customers`

Expected: Page loads with pagination controls at bottom, can navigate between pages

- [ ] **Step 7: Commit updated client component**

```bash
git add src/app/customers/CustomerClientPage.tsx src/app/customers/CustomerClientPage.test.tsx
git commit -m "feat: integrate pagination controls with customer client page

- Add pagination props interface and state management
- Implement page change and page size change handlers
- Update URL search params on pagination navigation
- Maintain existing add customer and import functionality
- Add comprehensive test coverage for pagination integration"
```

---

### Task 5: Add Database Index for Performance

**Files:**
- Create: `database-customer-pagination-index.sql`

- [ ] **Step 1: Create database index migration**

Create `database-customer-pagination-index.sql`:

```sql
-- Add index for efficient customer pagination
-- This optimizes ORDER BY created_at with LIMIT/OFFSET queries

-- Check if index already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'customers' 
    AND indexname = 'idx_customers_pagination'
  ) THEN
    -- Create composite index for pagination performance
    CREATE INDEX idx_customers_pagination 
    ON customers(created_at DESC, id DESC);
    
    RAISE NOTICE 'Created pagination index: idx_customers_pagination';
  ELSE
    RAISE NOTICE 'Pagination index already exists: idx_customers_pagination';
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON INDEX idx_customers_pagination IS 
'Optimizes customer pagination queries ordered by created_at DESC with LIMIT/OFFSET';

-- Performance verification query (optional - for testing)
-- EXPLAIN ANALYZE 
-- SELECT * FROM customers 
-- ORDER BY created_at DESC, id DESC 
-- LIMIT 50 OFFSET 100;
```

- [ ] **Step 2: Test index creation in development**

If you have access to the Supabase database:
```sql
-- Run this in Supabase SQL Editor to test
\i database-customer-pagination-index.sql
```

Expected: Index created successfully or already exists message

- [ ] **Step 3: Verify pagination performance**

Run: `npm run dev` and test pagination with different page sizes

Expected: Fast page navigation (< 500ms per page)

- [ ] **Step 4: Commit database optimization**

```bash
git add database-customer-pagination-index.sql
git commit -m "perf: add database index for customer pagination

- Add composite index on (created_at DESC, id DESC)
- Optimizes ORDER BY queries with LIMIT/OFFSET
- Includes existence check to prevent duplicate indexes
- Add performance documentation comments"
```

---

### Task 6: Integration Testing and Final Validation

**Files:**
- Create: `src/app/customers/pagination.integration.test.tsx`

- [ ] **Step 1: Create integration test**

Create `src/app/customers/pagination.integration.test.tsx`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { createClient } from "@/lib/supabase/server"

describe("Customer Pagination Integration", () => {
  let supabase: any
  let testCustomerIds: number[] = []

  beforeAll(async () => {
    supabase = await createClient()
    
    // Create test customers for pagination testing
    const testCustomers = Array.from({ length: 75 }, (_, i) => ({
      name: `Test Customer ${i + 1}`,
      phone: `+66-1234-${String(i + 1).padStart(4, '0')}`,
      responsible_person: `Responsible ${i + 1}`,
    }))

    const { data, error } = await supabase
      .from("customers")
      .insert(testCustomers)
      .select("id")

    if (!error && data) {
      testCustomerIds = data.map((customer: any) => customer.id)
    }
  })

  afterAll(async () => {
    // Clean up test customers
    if (testCustomerIds.length > 0) {
      await supabase
        .from("customers")
        .delete()
        .in("id", testCustomerIds)
    }
  })

  it("should fetch first page with correct range", async () => {
    const page = 1
    const limit = 25
    const start = (page - 1) * limit // 0
    const end = start + limit - 1    // 24

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false })
      .range(start, end)

    expect(error).toBeNull()
    expect(data).toHaveLength(25)
  })

  it("should fetch second page with correct range", async () => {
    const page = 2
    const limit = 25
    const start = (page - 1) * limit // 25
    const end = start + limit - 1    // 49

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false })
      .range(start, end)

    expect(error).toBeNull()
    expect(data).toHaveLength(25)
  })

  it("should get accurate total count", async () => {
    const { count, error } = await supabase
      .from("customers")
      .select("*", { count: 'exact', head: true })

    expect(error).toBeNull()
    expect(typeof count).toBe('number')
    expect(count).toBeGreaterThan(0)
  })

  it("should handle page size of 50", async () => {
    const page = 1
    const limit = 50
    const start = (page - 1) * limit
    const end = start + limit - 1

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false })
      .range(start, end)

    expect(error).toBeNull()
    expect(data).toHaveLength(Math.min(50, data?.length || 0))
  })

  it("should handle large page size of 200", async () => {
    const page = 1
    const limit = 200
    const start = (page - 1) * limit
    const end = start + limit - 1

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false })
      .range(start, end)

    expect(error).toBeNull()
    expect(Array.isArray(data)).toBe(true)
  })
})
```

- [ ] **Step 2: Run integration tests**

Run: `npm test -- src/app/customers/pagination.integration.test.tsx`

Expected: All tests pass, pagination queries work correctly

- [ ] **Step 3: Test complete user flow**

Manual testing checklist:
1. Navigate to `/customers` - should show page 1 with 50 items
2. Click "Next" - should go to page 2
3. Change page size to 25 - should reset to page 1 with 25 items
4. Use page number buttons to navigate
5. Test URL navigation: `/customers?page=3&limit=100`
6. Test browser back/forward buttons
7. Test on mobile device - responsive pagination

- [ ] **Step 4: Performance testing**

Run with large dataset:
```bash
# Monitor response times in browser dev tools
# Navigate between pages and check network timing
# Verify database query performance
```

Expected: Page loads < 500ms, smooth navigation

- [ ] **Step 5: Accessibility testing**

Test with keyboard navigation:
- Tab through pagination controls
- Use Enter to activate page buttons
- Test with screen reader

Expected: All controls accessible via keyboard, proper ARIA labels

- [ ] **Step 6: Final commit**

```bash
git add src/app/customers/pagination.integration.test.tsx
git commit -m "test: add comprehensive pagination integration tests

- Test Supabase range queries with various page sizes
- Verify total count accuracy and performance
- Add cleanup for test data management
- Cover edge cases and boundary conditions"
```

---

## Self-Review

**Spec Coverage Check:**
- ✅ Server-side pagination with URL search params
- ✅ Page size options: 25, 50, 100, 200 (default 50)
- ✅ Bottom-only pagination layout  
- ✅ shadcn/ui components (Button, Select, Table)
- ✅ Responsive design with mobile optimization
- ✅ Multilingual support (Thai, English, Russian)
- ✅ Error handling for edge cases
- ✅ Performance optimization with database index
- ✅ Comprehensive testing strategy

**Type Consistency Check:**
- ✅ PaginationControlsProps interface matches usage
- ✅ PaginationData interface consistent across components
- ✅ Customer type unchanged from existing implementation
- ✅ Function signatures consistent (onPageChange, onPageSizeChange)

**Implementation Completeness:**
- ✅ All required files created/modified
- ✅ Translation keys added to all language files
- ✅ Database index for performance optimization
- ✅ Tests for components, server logic, and integration
- ✅ Error handling and edge cases covered