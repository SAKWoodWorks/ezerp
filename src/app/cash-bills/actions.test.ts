// ไฟล์ทดสอบสำหรับ Actions ของใบเสร็จรับเงิน (Cash Bills)
// Test file for Cash Bill Actions
// ทดสอบการสร้างใบเสร็จรับเงินและการตัดสต็อก
// Tests creating cash bills and stock deduction
import { describe, it, expect, vi, beforeEach } from "vitest"
import { addCashBill } from "./actions"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

// จำลอง (Mock) dependencies ที่จำเป็น
// Mock necessary dependencies
vi.mock("@/lib/supabase/server")
vi.mock("next/navigation")
vi.mock("next/cache")

// ชุดทดสอบสำหรับ Actions ของใบเสร็จรับเงิน
// Test suite for Cash Bill Actions
describe("Cash Bill Actions", () => {
  // สร้าง Mock Supabase Client สำหรับการทดสอบ
  // Create Mock Supabase Client for testing
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    rpc: vi.fn(),
  }

  // ก่อนแต่ละ test ให้ล้าง mock ทั้งหมด
  // Clear all mocks before each test
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(
      mockSupabase as unknown as Awaited<ReturnType<typeof createClient>>
    )
  })

  // ทดสอบการสร้างใบเสร็จรับเงิน
  // Test adding cash bills
  describe("addCashBill", () => {
    // ทดสอบ: ต้องคืนค่า error ถ้าผู้ใช้ยังไม่ได้ยืนยันตัวตน
    // Test: Should return error if user is not authenticated
    it("returns error if user is not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const formData = new FormData()
      const result = await addCashBill(formData)

      expect(result).toEqual({ error: "Authentication required" })
    })

    // ทดสอบ: ตรวจสอบการเลือกคลังสินค้า
    // Test: Validates warehouse selection
    it("validates warehouse selection", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "test-user-id" } },
        error: null,
      })

      const formData = new FormData()
      formData.append("items", JSON.stringify([]))
      // Not setting warehouseId

      const result = await addCashBill(formData)

      expect(result).toEqual({
        error: "Please select a warehouse to deduct stock from.",
      })
    })

    // ทดสอบ: ตรวจสอบว่าต้องมีอย่างน้อยหนึ่งรายการ
    // Test: Validates at least one item is required
    it("validates at least one item is required", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "test-user-id" } },
        error: null,
      })

      const formData = new FormData()
      formData.append("warehouseId", "1")
      formData.append("items", JSON.stringify([]))

      const result = await addCashBill(formData)

      expect(result).toEqual({ error: "Please add at least one item." })
    })

    // ทดสอบ: สร้างใบเสร็จรับเงินสำเร็จ
    // Test: Successfully creates a cash bill
    it("successfully creates a cash bill", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "test-user-id" } },
        error: null,
      })

      mockSupabase.rpc.mockResolvedValue({
        data: 123,
        error: null,
      })

      const items = [
        {
          productId: 1,
          description: "Wood Panel",
          quantity: 5,
          unitPrice: 500,
          ecommerce_size: null,
        },
        {
          productId: 2,
          description: "Door Frame",
          quantity: 2,
          unitPrice: 1000,
          ecommerce_size: 120,
        },
      ]

      const formData = new FormData()
      formData.append("customerId", "10")
      formData.append("responsiblePersonId", "3")
      formData.append("issueDate", "2025-01-15")
      formData.append("warehouseId", "2")
      formData.append("salesChannel", "walk-in")
      formData.append("items", JSON.stringify(items))

      await addCashBill(formData)

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        "create_cash_bill_and_process",
        {
          p_customer_id: 10,
          p_responsible_person_id: 3,
          p_issue_date: "2025-01-15",
          p_items: items,
          p_warehouse_id: 2,
          p_sales_channel: "walk-in",
        }
      )
      expect(revalidatePath).toHaveBeenCalledWith("/cash-bills")
      expect(revalidatePath).toHaveBeenCalledWith("/products")
      expect(revalidatePath).toHaveBeenCalledWith("/dashboard")
      expect(redirect).toHaveBeenCalledWith("/cash-bills/123")
    })

    // ทดสอบ: จัดการใบเสร็จรับเงินสำหรับลูกค้าทั่วไป (ไม่มีข้อมูลลูกค้า)
    // Test: Handles cash bill without customer (walk-in)
    it("handles cash bill without customer (walk-in)", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "test-user-id" } },
        error: null,
      })

      mockSupabase.rpc.mockResolvedValue({
        data: 456,
        error: null,
      })

      const items = [
        {
          productId: 5,
          description: "Small Item",
          quantity: 10,
          unitPrice: 50,
          ecommerce_size: null,
        },
      ]

      const formData = new FormData()
      // No customerId or responsiblePersonId
      formData.append("issueDate", "2025-01-20")
      formData.append("warehouseId", "1")
      formData.append("salesChannel", "online")
      formData.append("items", JSON.stringify(items))

      await addCashBill(formData)

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        "create_cash_bill_and_process",
        expect.objectContaining({
          p_customer_id: null,
          p_responsible_person_id: null,
          p_sales_channel: "online",
        })
      )
    })

    // ทดสอบ: จัดการสินค้า e-commerce ที่มีขนาด
    // Test: Handles e-commerce items with sizes
    it("handles e-commerce items with sizes", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "test-user-id" } },
        error: null,
      })

      mockSupabase.rpc.mockResolvedValue({
        data: 789,
        error: null,
      })

      const items = [
        {
          productId: 10,
          description: "E-commerce Product",
          quantity: 3,
          unitPrice: 200,
          ecommerce_size: 30,
        },
        {
          productId: 11,
          description: "Another E-commerce Product",
          quantity: 5,
          unitPrice: 150,
          ecommerce_size: 45,
        },
      ]

      const formData = new FormData()
      formData.append("customerId", "5")
      formData.append("issueDate", "2025-01-25")
      formData.append("warehouseId", "3")
      formData.append("salesChannel", "e-commerce")
      formData.append("items", JSON.stringify(items))

      await addCashBill(formData)

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        "create_cash_bill_and_process",
        expect.objectContaining({
          p_items: items,
          p_sales_channel: "e-commerce",
        })
      )
    })

    // ทดสอบ: จัดการข้อมูล JSON ที่ไม่ถูกต้อง
    // Test: Handles invalid JSON items data
    it("handles invalid JSON items data", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "test-user-id" } },
        error: null,
      })

      const formData = new FormData()
      formData.append("warehouseId", "1")
      formData.append("items", "invalid-json")

      const result = await addCashBill(formData)

      expect(result).toEqual({ error: "Invalid items data." })
    })

    // ทดสอบ: จัดการ error จาก RPC ของ Supabase
    // Test: Handles RPC errors from Supabase
    it("handles RPC errors from Supabase", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "test-user-id" } },
        error: null,
      })

      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: "Insufficient stock in warehouse" },
      })

      const items = [
        {
          productId: 1,
          description: "Product",
          quantity: 1000,
          unitPrice: 100,
          ecommerce_size: null,
        },
      ]

      const formData = new FormData()
      formData.append("warehouseId", "1")
      formData.append("issueDate", "2025-01-01")
      formData.append("salesChannel", "walk-in")
      formData.append("items", JSON.stringify(items))

      const result = await addCashBill(formData)

      expect(result).toEqual({ error: "Insufficient stock in warehouse" })
    })

    // ทดสอบ: จัดการกรณีที่ข้อมูล items หายไป
    // Test: Handles missing items field gracefully
    it("handles missing items field gracefully", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "test-user-id" } },
        error: null,
      })

      const formData = new FormData()
      formData.append("warehouseId", "1")
      // Missing items field

      const result = await addCashBill(formData)

      expect(result).toEqual({ error: "Invalid items data." })
    })
  })
})
