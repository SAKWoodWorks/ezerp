import { describe, it, expect, vi, beforeEach } from "vitest"
import { createPOSSale } from "./actions"

const mockRpc = vi.fn().mockResolvedValue({ data: 42, error: null })
const mockUpdate = vi.fn().mockReturnThis()
const mockEq = vi.fn().mockResolvedValue({ error: null })
const mockFrom = vi.fn().mockReturnValue({
  update: mockUpdate,
  eq: mockEq,
})

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      }),
    },
    rpc: mockRpc,
    from: mockFrom,
  })),
}))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({ redirect: vi.fn() }))

describe("createPOSSale", () => {
  beforeEach(() => vi.clearAllMocks())

  it("calls create_cash_bill_and_process RPC and redirects", async () => {
    const formData = new FormData()
    formData.set("customerId", "1")
    formData.set("responsiblePersonId", "")
    formData.set("issueDate", "2026-04-28")
    formData.set("warehouseId", "1")
    formData.set("salesChannel", "POS")
    formData.set(
      "items",
      JSON.stringify([
        {
          productId: 1,
          description: "Test",
          quantity: 2,
          unitPrice: 100,
          ecommerce_size: null,
        },
      ])
    )
    formData.set("paymentMethod", "cash")

    await createPOSSale(formData)

    expect(mockRpc).toHaveBeenCalledWith(
      "create_cash_bill_and_process",
      expect.objectContaining({
        p_warehouse_id: 1,
        p_sales_channel: "POS",
      })
    )
  })

  it("returns error when no items provided", async () => {
    const formData = new FormData()
    formData.set("warehouseId", "1")
    formData.set("items", JSON.stringify([]))

    const result = await createPOSSale(formData)
    expect(result).toEqual({ error: "Please add at least one item." })
  })

  it("returns error when no warehouse selected", async () => {
    const formData = new FormData()
    formData.set(
      "items",
      JSON.stringify([
        {
          productId: 1,
          description: "x",
          quantity: 1,
          unitPrice: 50,
          ecommerce_size: null,
        },
      ])
    )

    const result = await createPOSSale(formData)
    expect(result).toEqual({ error: "Please select a warehouse." })
  })
})
