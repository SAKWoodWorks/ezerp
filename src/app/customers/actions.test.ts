import { describe, it, expect, vi, beforeEach } from "vitest"
import { importCustomers } from "./actions"

/**
 * CSV Import Tests - Test-Driven Development (TDD)
 *
 * These tests are intentionally written to fail until CSV parsing is implemented.
 * This follows TDD methodology:
 * 1. Write failing tests first (Task 1) ✓
 * 2. Implement code to make tests pass (Task 2)
 * 3. Refactor and improve (Task 3+)
 *
 * Tests will pass once CSV detection and column mapping is implemented.
 */

// These tests expect CSV-specific column mapping (customer_name -> name, customer_branch -> responsible_person)
// Current implementation lacks CSV detection and proper column mapping
// Tests will fail because CSV columns aren't mapped to database schema correctly

// Mock Supabase with more realistic behavior
const mockInsert = vi.fn().mockImplementation((data) => {
  // Check if any record has undefined/null name (simulating DB constraint)
  const hasInvalidNames = data.some((record: any) => !record.name)

  const result = hasInvalidNames
    ? { error: { message: "null value in column 'name' violates not-null constraint" }, count: 0 }
    : { error: null, count: data.length }

  // Since .select() is commented out in the implementation, we return the result directly
  return Promise.resolve(result)
})

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: mockInsert,
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

describe("importCustomers", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInsert.mockClear()
  })


  it("should parse CSV customer data correctly", async () => {
    // CSV data with customer_name, customer_branch that need mapping to name, responsible_person
    const csvData = `id,customer_name,customer_tax_id,customer_address,customer_phone,customer_branch,created_at
test-id,Test Company,123456789,123 Test St,555-1234,Bangkok Branch,2026-04-29T00:00:00Z
test-id-2,Another Company,987654321,456 Another St,555-5678,Phuket Branch,2026-04-29T00:00:00Z`

    const base64Data = Buffer.from(csvData).toString("base64")

    const result = await importCustomers(base64Data)

    // CSV parsing now works with proper column mapping!
    expect(result.error).toBeUndefined()
    expect(result.success).toBe(true)
    expect(result.count).toBe(2)
  })

  it("should handle CSV with missing optional fields", async () => {
    // CSV with customer_name that needs mapping to name field
    const csvData = `id,customer_name,customer_tax_id,customer_address,customer_phone,customer_branch,created_at
test-id,Test Company,,123 Test St,,,2026-04-29T00:00:00Z`

    const base64Data = Buffer.from(csvData).toString("base64")

    const result = await importCustomers(base64Data)

    // CSV parsing now works with proper column mapping! Missing optional fields should be handled gracefully
    expect(result.error).toBeUndefined()
    expect(result.success).toBe(true)
    expect(result.count).toBe(1)
  })

  it("should reject CSV with missing required fields", async () => {
    // CSV with empty customer_name (which should map to required name field)
    const csvData = `id,customer_name,customer_tax_id,customer_address,customer_phone,customer_branch,created_at
test-id,,123456789,123 Test St,555-1234,Bangkok Branch,2026-04-29T00:00:00Z`

    const base64Data = Buffer.from(csvData).toString("base64")

    const result = await importCustomers(base64Data)

    // CSV parsing now properly validates required fields and provides clear error messages
    expect(result.error).toBeDefined()
    expect(result.error).toContain("missing required field: name")
  })

  // Error Handling Test Cases
  describe("Error Handling", () => {
    it("should handle malformed CSV gracefully", async () => {
      const malformedCSV = `id,customer_name,customer_tax_id
broken line without proper commas
another,broken,line,with,too,many,commas`

      const base64Data = Buffer.from(malformedCSV).toString("base64")

      const result = await importCustomers(base64Data)

      expect(result.error).toContain("missing required field: name")
    })

    it("should handle empty CSV file", async () => {
      const emptyCSV = `id,customer_name,customer_tax_id,customer_address,customer_phone,customer_branch,created_at`

      const base64Data = Buffer.from(emptyCSV).toString("base64")

      const result = await importCustomers(base64Data)

      expect(result.error).toBe("CSV file must have at least a header row and one data row")
    })

    it("should handle CSV with wrong headers", async () => {
      const wrongHeadersCSV = `wrong,headers,here
value1,value2,value3`

      const base64Data = Buffer.from(wrongHeadersCSV).toString("base64")

      const result = await importCustomers(base64Data)

      expect(result.error).toBe("Failed to import customers to the database.")
    })

    it("should handle non-CSV files gracefully", async () => {
      // Try to pass a non-CSV file (without customer_name header)
      const nonCSVData = `some,random,data
without,proper,format`

      const base64Data = Buffer.from(nonCSVData).toString("base64")

      const result = await importCustomers(base64Data)

      // This should be treated as Excel and fail gracefully
      expect(result.error).toBe("Failed to import customers to the database.")
    })

    it("should handle completely invalid file data", async () => {
      // Try to pass completely invalid base64 data that will cause parsing to fail
      const invalidData = "not-valid-base64-data-$%^&*()"

      const result = await importCustomers(invalidData)

      expect(result.error).toBe("File is empty or has incorrect format.")
    })

    it("should handle CSV with quoted fields containing commas", async () => {
      const quotedCSV = `id,customer_name,customer_tax_id,customer_address,customer_phone,customer_branch,created_at
test-id,"Company, Inc.",123456789,"Address with, commas",555-1234,Bangkok Branch,2026-04-29T00:00:00Z`

      const base64Data = Buffer.from(quotedCSV).toString("base64")

      const result = await importCustomers(base64Data)

      expect(result.success).toBe(true)
      expect(result.count).toBe(1)
    })

    it("should handle CSV with escaped quotes", async () => {
      const escapedQuotesCSV = `id,customer_name,customer_tax_id,customer_address,customer_phone,customer_branch,created_at
test-id,"Company ""ABC"" Ltd",123456789,123 Test St,555-1234,Bangkok Branch,2026-04-29T00:00:00Z`

      const base64Data = Buffer.from(escapedQuotesCSV).toString("base64")

      const result = await importCustomers(base64Data)

      expect(result.success).toBe(true)
      expect(result.count).toBe(1)
    })

    it("should handle very large CSV files", async () => {
      // Generate a CSV with many rows to test performance
      let largeCsv = `id,customer_name,customer_tax_id,customer_address,customer_phone,customer_branch,created_at\n`

      for (let i = 1; i <= 100; i++) {
        largeCsv += `test-${i},Company ${i},12345678${i.toString().padStart(2, '0')},Address ${i},555-123${i.toString().padStart(2, '0')},Branch ${i},2026-04-29T00:00:00Z\n`
      }

      const base64Data = Buffer.from(largeCsv).toString("base64")

      const result = await importCustomers(base64Data)

      expect(result.success).toBe(true)
      expect(result.count).toBe(100)
    })

    it("should handle authentication errors", async () => {
      // Mock authentication failure
      const { createClient } = await import("@/lib/supabase/server")
      const mockClient = createClient as any

      // Temporarily override the mock to return no user
      const originalMock = vi.mocked(mockClient)
      vi.mocked(createClient).mockReturnValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      } as any)

      const csvData = `id,customer_name,customer_tax_id,customer_address,customer_phone,customer_branch,created_at
test-id,Test Company,123456789,123 Test St,555-1234,Bangkok Branch,2026-04-29T00:00:00Z`

      const base64Data = Buffer.from(csvData).toString("base64")

      const result = await importCustomers(base64Data)

      expect(result.error).toBe("Authentication required")
    })

    it("should handle database insertion errors", async () => {
      // Mock database error by overriding the mockInsert function
      const originalMockInsert = mockInsert.getMockImplementation()
      mockInsert.mockImplementationOnce(() => {
        return Promise.resolve({
          error: new Error("Database connection failed"),
          count: null
        })
      })

      const csvData = `id,customer_name,customer_tax_id,customer_address,customer_phone,customer_branch,created_at
test-id,Test Company,123456789,123 Test St,555-1234,Bangkok Branch,2026-04-29T00:00:00Z`

      const base64Data = Buffer.from(csvData).toString("base64")

      const result = await importCustomers(base64Data)

      expect(result.error).toBe("Failed to import customers to the database.")

      // Restore original implementation
      if (originalMockInsert) {
        mockInsert.mockImplementation(originalMockInsert)
      }
    })
  })
})