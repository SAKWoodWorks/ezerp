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