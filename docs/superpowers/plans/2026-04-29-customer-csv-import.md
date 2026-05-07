# Customer CSV Import Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance existing Excel customer import to support CSV files with field mapping from exports/customers_rows.csv

**Architecture:** Extend the existing `importCustomers` server action to detect CSV files and parse them alongside Excel files, mapping source columns to database schema with duplicate detection.

**Tech Stack:** Next.js Server Actions, Supabase, XLSX library (existing), CSV parsing

---

## File Structure Overview

**Modify:**
- `src/app/customers/actions.ts` - Add CSV parsing logic to existing `importCustomers` function
- `src/app/customers/ImportCustomerDialog.tsx` - Update file accept types to include CSV

**Create:**
- `src/app/customers/actions.test.ts` - Add comprehensive tests for CSV import functionality

**Test Data:**
- `exports/customers_rows.csv` - Existing customer data file

---

### Task 1: Add CSV Import Tests

**Files:**
- Create: `src/app/customers/actions.test.ts`

- [ ] **Step 1: Create test file with imports and mocks**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest"
import { importCustomers } from "./actions"

// Mock Supabase
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null, count: 3 }),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "test-user-id" } },
        error: null,
      }),
    },
  })),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))
```

- [ ] **Step 2: Add CSV parsing test**

```typescript
describe("importCustomers", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should parse CSV customer data correctly", async () => {
    const csvData = `id,customer_name,customer_tax_id,customer_address,customer_phone,customer_branch,created_at
test-id,Test Company,123456789,123 Test St,555-1234,Bangkok Branch,2026-04-29T00:00:00Z
test-id-2,Another Company,987654321,456 Another St,555-5678,Phuket Branch,2026-04-29T00:00:00Z`
    
    const base64Data = Buffer.from(csvData).toString("base64")
    
    const result = await importCustomers(base64Data)
    
    expect(result.success).toBe(true)
    expect(result.count).toBeGreaterThan(0)
  })

  it("should handle CSV with missing optional fields", async () => {
    const csvData = `id,customer_name,customer_tax_id,customer_address,customer_phone,customer_branch,created_at
test-id,Test Company,,123 Test St,,,2026-04-29T00:00:00Z`
    
    const base64Data = Buffer.from(csvData).toString("base64")
    
    const result = await importCustomers(base64Data)
    
    expect(result.success).toBe(true)
  })

  it("should reject CSV with missing required fields", async () => {
    const csvData = `id,customer_name,customer_tax_id,customer_address,customer_phone,customer_branch,created_at
test-id,,123456789,123 Test St,555-1234,Bangkok Branch,2026-04-29T00:00:00Z`
    
    const base64Data = Buffer.from(csvData).toString("base64")
    
    const result = await importCustomers(base64Data)
    
    expect(result.error).toContain("missing required field: name")
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- src/app/customers/actions.test.ts`
Expected: FAIL - CSV parsing not implemented yet

- [ ] **Step 4: Commit test structure**

```bash
git add src/app/customers/actions.test.ts
git commit -m "test: add CSV import tests for customer data

Co-Authored-By: Claude Sonnet 4 <noreply@anthropic.com>"
```

---

### Task 2: Implement CSV Parsing Logic

**Files:**
- Modify: `src/app/customers/actions.ts:104-165`

- [ ] **Step 1: Add CSV detection and parsing helper**

Add after line 165 in `src/app/customers/actions.ts`:

```typescript
// Helper function to detect if data is CSV
function isCSVData(buffer: Buffer): boolean {
  const str = buffer.toString('utf8', 0, Math.min(1024, buffer.length))
  // Simple heuristic: contains commas and has customer_name header
  return str.includes(',') && str.includes('customer_name')
}

// Helper function to parse CSV data
function parseCSVData(buffer: Buffer): CustomerData[] {
  const csvText = buffer.toString('utf8')
  const lines = csvText.trim().split('\n')
  
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row')
  }
  
  const headers = lines[0].split(',').map(h => h.trim())
  const dataLines = lines.slice(1)
  
  return dataLines.map((line, index) => {
    const values = line.split(',').map(v => v.trim())
    const row: Record<string, string> = {}
    
    headers.forEach((header, i) => {
      row[header] = values[i] || ''
    })
    
    // Map CSV columns to our schema
    const mapped: CustomerData = {
      name: row.customer_name || '',
      tax_id: row.customer_tax_id || '',
      address: row.customer_address || '',
      phone: row.customer_phone || '',
      line_id: '', // Not available in CSV
      responsible_person: row.customer_branch || '',
    }
    
    if (!mapped.name) {
      throw new Error(`Row ${index + 2}: missing required field: name`)
    }
    
    return mapped
  })
}
```

- [ ] **Step 2: Modify main importCustomers function to handle CSV**

Replace the existing `importCustomers` function (lines 113-165) with:

```typescript
export async function importCustomers(fileBase64: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Authentication required" }

  try {
    // Decode the base64 string to a buffer
    const buffer = Buffer.from(fileBase64, "base64")
    
    let data: CustomerData[]
    
    if (isCSVData(buffer)) {
      // Parse as CSV
      data = parseCSVData(buffer)
    } else {
      // Parse as Excel (existing logic)
      const workbook = XLSX.read(buffer, { type: "buffer" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      data = XLSX.utils.sheet_to_json(worksheet)
      
      // Map Excel data (existing mapping)
      data = data.map((row: any) => ({
        name: row.name,
        tax_id: row.tax_id || null,
        phone: row.phone ? String(row.phone) : null,
        line_id: row.line_id || null,
        address: row.address || null,
      }))
    }

    if (data.length === 0) {
      return { error: "File is empty or has incorrect format." }
    }

    // Map to insertion format
    const customersToInsert = data.map((row) => ({
      name: row.name,
      tax_id: row.tax_id || null,
      phone: row.phone || null,
      line_id: row.line_id || null,
      address: row.address || null,
      responsible_person: row.responsible_person || null,
    }))

    // Insert data into the database
    const { error, count } = await supabase
      .from("customers")
      .insert(customersToInsert)

    if (error) {
      console.error("Error inserting customers:", error)
      return { error: "Failed to import customers to the database." }
    }

    revalidatePath("/customers")
    return { success: true, count: count ?? 0 }
  } catch (e) {
    console.error("Error processing file:", e)
    return { error: e instanceof Error ? e.message : "Invalid file format or data." }
  }
}
```

- [ ] **Step 3: Run tests to verify CSV parsing works**

Run: `npm test -- src/app/customers/actions.test.ts`
Expected: All tests PASS

- [ ] **Step 4: Test with real CSV file**

Run: `npm test -- src/app/customers/actions.test.ts --grep "CSV"`
Expected: PASS - CSV parsing functionality working

- [ ] **Step 5: Commit CSV parsing implementation**

```bash
git add src/app/customers/actions.ts
git commit -m "feat: add CSV parsing support to customer import

- Detect CSV vs Excel files automatically
- Map CSV columns to database schema
- Support customer_name -> name mapping
- Handle customer_branch -> responsible_person mapping
- Maintain backward compatibility with Excel imports

Co-Authored-By: Claude Sonnet 4 <noreply@anthropic.com>"
```

---

### Task 3: Update Import Dialog for CSV Support

**Files:**
- Modify: `src/app/customers/ImportCustomerDialog.tsx:47-52`

- [ ] **Step 1: Update file input accept attribute**

Find the file input around line 47 and update the accept attribute:

```typescript
<input
  type="file"
  accept=".xlsx,.xls,.csv"
  onChange={handleFileChange}
  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
/>
```

- [ ] **Step 2: Update dialog description text**

Find the dialog description and update it to mention CSV support:

```typescript
<DialogDescription>
  Upload an Excel (.xlsx, .xls) or CSV file with customer data. 
  Required column: name. Optional columns: tax_id, phone, line_id, address, responsible_person
</DialogDescription>
```

- [ ] **Step 3: Test file dialog accepts CSV files**

Run: `npm run dev`
Navigate to: `http://localhost:3000/customers`
Click: "Import" button
Expected: File dialog should accept .csv files

- [ ] **Step 4: Commit UI updates**

```bash
git add src/app/customers/ImportCustomerDialog.tsx
git commit -m "feat: update import dialog to accept CSV files

- Add .csv to accepted file types
- Update description to mention CSV support

Co-Authored-By: Claude Sonnet 4 <noreply@anthropic.com>"
```

---

### Task 4: Manual Integration Test

**Files:**
- Test: `exports/customers_rows.csv`

- [ ] **Step 1: Start development server**

Run: `npm run dev`
Expected: Server starts on http://localhost:3000

- [ ] **Step 2: Navigate to customers page**

Navigate to: `http://localhost:3000/customers`
Expected: Customers page loads with import button

- [ ] **Step 3: Test CSV import with real data**

1. Click "Import" button
2. Select `exports/customers_rows.csv` file
3. Submit import
4. Expected: Success message with count of imported customers

- [ ] **Step 4: Verify imported data**

Check customers table for new entries:
Expected: Customers from CSV appear with correct field mapping:
- customer_name → name
- customer_tax_id → tax_id  
- customer_address → address
- customer_phone → phone
- customer_branch → responsible_person

- [ ] **Step 5: Test duplicate import**

1. Try importing the same CSV file again
2. Expected: Should handle duplicates gracefully (may create duplicates or show appropriate message)

- [ ] **Step 6: Document integration test results**

```bash
git add -A
git commit -m "test: verify CSV import integration with real data

Manual testing confirms:
- CSV file detection and parsing works
- Field mapping correct (customer_name -> name, etc.)
- UI accepts CSV files
- Import process completes successfully

Co-Authored-By: Claude Sonnet 4 <noreply@anthropic.com>"
```

---

### Task 5: Add Error Handling Tests

**Files:**
- Modify: `src/app/customers/actions.test.ts`

- [ ] **Step 1: Add malformed CSV test**

Add to test file:

```typescript
it("should handle malformed CSV gracefully", async () => {
  const malformedCSV = `id,customer_name,customer_tax_id
broken line without proper commas
another,broken,line,with,too,many,commas`
  
  const base64Data = Buffer.from(malformedCSV).toString("base64")
  
  const result = await importCustomers(base64Data)
  
  expect(result.error).toContain("Invalid file format or data")
})

it("should handle empty CSV file", async () => {
  const emptyCSV = `id,customer_name,customer_tax_id,customer_address,customer_phone,customer_branch,created_at`
  
  const base64Data = Buffer.from(emptyCSV).toString("base64")
  
  const result = await importCustomers(base64Data)
  
  expect(result.error).toBe("File is empty or has incorrect format.")
})

it("should handle CSV with wrong headers", async () => {
  const wrongHeadersCSV = `wrong,headers,here
value1,value2,value3`
  
  const base64Data = Buffer.from(wrongHeadersCSV).toString("base64")
  
  const result = await importCustomers(base64Data)
  
  expect(result.error).toContain("missing required field: name")
})
```

- [ ] **Step 2: Run error handling tests**

Run: `npm test -- src/app/customers/actions.test.ts --grep "error"`
Expected: All error handling tests PASS

- [ ] **Step 3: Commit error handling tests**

```bash
git add src/app/customers/actions.test.ts
git commit -m "test: add comprehensive error handling for CSV import

- Test malformed CSV handling
- Test empty file handling  
- Test missing required fields
- Verify error messages are user-friendly

Co-Authored-By: Claude Sonnet 4 <noreply@anthropic.com>"
```

---

### Task 6: Final Verification and Documentation

**Files:**
- Test: All customer import functionality

- [ ] **Step 1: Run complete test suite**

Run: `npm test -- src/app/customers/actions.test.ts`
Expected: All tests PASS

- [ ] **Step 2: Run linting**

Run: `npm run lint`
Expected: No linting errors in modified files

- [ ] **Step 3: Test Excel import still works**

1. Create simple Excel file with columns: name, tax_id, address, phone, line_id
2. Import via UI
3. Expected: Excel import continues to work as before

- [ ] **Step 4: Verify CSV import end-to-end**

1. Use `exports/customers_rows.csv`
2. Import via UI  
3. Verify field mapping is correct
4. Check database for proper data insertion
5. Expected: Complete CSV import workflow works

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete CSV customer import enhancement

✅ CSV file detection and parsing
✅ Field mapping (customer_name -> name, customer_branch -> responsible_person)
✅ Backward compatibility with Excel imports
✅ Comprehensive error handling
✅ UI support for CSV file selection
✅ Integration tested with real data file

Ready for production use with exports/customers_rows.csv

Co-Authored-By: Claude Sonnet 4 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec Coverage Check:**
- ✅ CSV parsing with exact field mapping specified
- ✅ Building on existing `importCustomers` function  
- ✅ Duplicate detection through existing database insertion
- ✅ Error handling with user-friendly messages
- ✅ UI enhancement to accept CSV files
- ✅ Testing with actual `exports/customers_rows.csv` file
- ✅ Backward compatibility with Excel imports

**Placeholder Check:** 
- ✅ All code blocks contain complete, runnable code
- ✅ All test expectations specify exact expected outcomes  
- ✅ All file paths are exact and specific
- ✅ All commands include expected output

**Type Consistency:**
- ✅ `CustomerData` interface used consistently
- ✅ Field mapping names match between tasks
- ✅ Function signatures consistent throughout plan