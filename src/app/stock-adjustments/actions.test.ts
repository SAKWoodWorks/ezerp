import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  getStockAdjustments,
  getStockAdjustmentById,
  createStockAdjustment,
  deleteStockAdjustment,
} from "./actions"

// Mock Supabase
const mockSupabase = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn(),
  },
  rpc: vi.fn(),
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => mockSupabase),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

describe("Stock Adjustments Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    })
  })

  describe("getStockAdjustments", () => {
    it("should fetch all stock adjustments with related data", async () => {
      const mockData = [
        {
          id: "adj-1",
          adjustment_number: "ADJ25001",
          product_id: "prod-1",
          warehouse_id: "wh-1",
          adjustment_type: "damage",
          quantity: -5,
          reason: "Damaged during handling",
          adjusted_by: "emp-1",
          adjustment_date: "2025-10-10T10:00:00Z",
          product: { name: "Product 1" },
          warehouse: { name: "Warehouse 1" },
          employee: { full_name: "John Doe" },
        },
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockData,
            error: null,
          }),
        }),
      })

      const result = await getStockAdjustments()

      expect(mockSupabase.from).toHaveBeenCalledWith("stock_adjustments")
      expect(result).toEqual(mockData)
    })

    it("should return empty array on error", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Error" },
          }),
        }),
      })

      const result = await getStockAdjustments()
      expect(result).toEqual([])
    })
  })

  describe("getStockAdjustmentById", () => {
    it("should fetch a single stock adjustment by ID", async () => {
      const mockData = {
        id: "adj-1",
        adjustment_number: "ADJ25001",
        product: { id: "prod-1", name: "Product 1", stock_quantity: 95 },
        warehouse: { id: "wh-1", name: "Warehouse 1" },
        employee: { id: "emp-1", full_name: "John Doe" },
      }

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockData,
              error: null,
            }),
          }),
        }),
      })

      const result = await getStockAdjustmentById("adj-1")

      expect(mockSupabase.from).toHaveBeenCalledWith("stock_adjustments")
      expect(result).toEqual(mockData)
    })

    it("should return null on error", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Not found" },
            }),
          }),
        }),
      })

      const result = await getStockAdjustmentById("non-existent")
      expect(result).toBeNull()
    })
  })

  describe("createStockAdjustment", () => {
    it("should create a new stock adjustment successfully", async () => {
      const formData = new FormData()
      formData.append("product_id", "prod-1")
      formData.append("warehouse_id", "wh-1")
      formData.append("adjustment_type", "damage")
      formData.append("quantity", "-5")
      formData.append("reason", "Damaged during handling")
      formData.append("adjusted_by", "emp-1")

      // Mock product check
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { stock_quantity: 100 },
              error: null,
            }),
          }),
        }),
      })

      // Mock insert
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "adj-new", adjustment_number: "ADJ25002" },
              error: null,
            }),
          }),
        }),
      })

      const result = await createStockAdjustment(formData)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it("should return error if required fields are missing", async () => {
      const formData = new FormData()
      formData.append("product_id", "prod-1")

      const result = await createStockAdjustment(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Missing required fields")
    })

    it("should return error if insufficient stock for negative adjustment", async () => {
      const formData = new FormData()
      formData.append("product_id", "prod-1")
      formData.append("warehouse_id", "wh-1")
      formData.append("adjustment_type", "damage")
      formData.append("quantity", "-150")
      formData.append("reason", "Damaged")
      formData.append("adjusted_by", "emp-1")

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { stock_quantity: 100 },
              error: null,
            }),
          }),
        }),
      })

      const result = await createStockAdjustment(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Insufficient stock for this adjustment")
    })

    it("should return error if user is not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const formData = new FormData()
      formData.append("product_id", "prod-1")
      formData.append("warehouse_id", "wh-1")
      formData.append("adjustment_type", "found")
      formData.append("quantity", "10")
      formData.append("reason", "Found items")
      formData.append("adjusted_by", "emp-1")

      const result = await createStockAdjustment(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Unauthorized")
    })
  })

  describe("deleteStockAdjustment", () => {
    it("should delete a stock adjustment and reverse stock change", async () => {
      // Mock fetch adjustment
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { product_id: "prod-1", quantity: -5 },
              error: null,
            }),
          }),
        }),
      })

      // Mock update product stock
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      })

      // Mock delete adjustment
      mockSupabase.from.mockReturnValueOnce({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      })

      const result = await deleteStockAdjustment("adj-1")

      expect(result.success).toBe(true)
    })

    it("should return error if adjustment not found", async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Not found" },
            }),
          }),
        }),
      })

      const result = await deleteStockAdjustment("non-existent")

      expect(result.success).toBe(false)
      expect(result.error).toBe("Adjustment not found")
    })

    it("should return error if user is not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await deleteStockAdjustment("adj-1")

      expect(result.success).toBe(false)
      expect(result.error).toBe("Unauthorized")
    })
  })
})
