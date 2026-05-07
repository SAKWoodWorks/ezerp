// ไฟล์ทดสอบสำหรับ Actions ของใบสั่งซื้อ (Purchase Orders)
// Test file for Purchase Order Actions
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  updatePurchaseOrderStatus,
  receiveOrderItems,
} from './actions'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// จำลอง (Mock) dependencies ที่จำเป็น
// Mock necessary dependencies
vi.mock('@/lib/supabase/server')
vi.mock('next/navigation')
vi.mock('next/cache')

// ชุดทดสอบสำหรับ Actions ของใบสั่งซื้อ
// Test suite for Purchase Order Actions
describe('Purchase Order Actions', () => {
  // สร้าง Mock Supabase Client สำหรับการทดสอบ
  // Create Mock Supabase Client for testing
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({
        data: { id: 1 },
        error: null
      }),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 1, po_number: 'PO25001' },
        error: null
      }),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    })),
    rpc: vi.fn().mockResolvedValue({ data: 'PO25001', error: null }),
  }

  // ก่อนแต่ละ test ให้ล้าง mock ทั้งหมด
  // Clear all mocks before each test
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  // ทดสอบการสร้างใบสั่งซื้อใหม่
  // Test creating new purchase orders
  describe('createPurchaseOrder', () => {
    // ทดสอบ: ต้อง redirect ไปหน้า login ถ้าผู้ใช้ยังไม่ได้ล็อกอิน
    // Test: Should redirect to login if user is not authenticated
    it('redirects to login if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const formData = new FormData()
      formData.append('supplierId', '1')

      await createPurchaseOrder(formData)

      expect(redirect).toHaveBeenCalledWith('/login')
    })

    // ทดสอบ: สร้างใบสั่งซื้อใหม่สำเร็จและ redirect
    // Test: Successfully creates a purchase order and redirects
    it('successfully creates a purchase order and redirects', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      const items = [
        { productId: 1, description: 'Test Product', quantity: 10, unitPrice: 100 },
      ]

      const formData = new FormData()
      formData.append('supplierId', '1')
      formData.append('orderDate', '2025-01-15')
      formData.append('expectedDeliveryDate', '2025-01-30')
      formData.append('notes', 'Test order')
      formData.append('status', 'draft')
      formData.append('items', JSON.stringify(items))

      // Mock successful PO number generation
      mockSupabase.rpc.mockResolvedValue({ data: 'PO25001', error: null })

      // Mock successful PO insertion
      const insertMock = vi.fn().mockReturnThis()
      const selectMock = vi.fn().mockReturnThis()
      const singleMock = vi.fn().mockResolvedValue({
        data: { id: 1, po_number: 'PO25001' },
        error: null,
      })

      mockSupabase.from = vi.fn((table) => {
        if (table === 'purchase_orders') {
          return {
            insert: insertMock,
            select: selectMock,
            single: singleMock,
          }
        }
        if (table === 'purchase_order_items') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return {}
      }) as any

      await createPurchaseOrder(formData)

      expect(mockSupabase.rpc).toHaveBeenCalledWith('generate_po_number')
      expect(mockSupabase.from).toHaveBeenCalledWith('purchase_orders')
      expect(mockSupabase.from).toHaveBeenCalledWith('purchase_order_items')
      expect(revalidatePath).toHaveBeenCalledWith('/purchase-orders')
      expect(redirect).toHaveBeenCalledWith('/purchase-orders/1')
    })

    // ทดสอบ: จัดการ error เมื่อข้อมูลไม่ครบ
    // Test: Handles missing required fields
    it('redirects with error when required fields are missing', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      const formData = new FormData()
      // Missing supplierId and items

      await createPurchaseOrder(formData)

      expect(redirect).toHaveBeenCalledWith(
        '/purchase-orders?message=Missing required fields'
      )
    })
  })

  // ทดสอบการอัปเดตใบสั่งซื้อ
  // Test updating purchase orders
  describe('updatePurchaseOrder', () => {
    // ทดสอบ: แก้ไขใบสั่งซื้อสำเร็จและ redirect
    // Test: Successfully updates a purchase order and redirects
    it('successfully updates a purchase order and redirects', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      const items = [
        { productId: 1, description: 'Updated Product', quantity: 20, unitPrice: 150 },
      ]

      const formData = new FormData()
      formData.append('supplierId', '1')
      formData.append('orderDate', '2025-01-16')
      formData.append('expectedDeliveryDate', '2025-02-01')
      formData.append('notes', 'Updated order')
      formData.append('status', 'sent')
      formData.append('items', JSON.stringify(items))

      const updateMock = vi.fn().mockReturnThis()
      const deleteMock = vi.fn().mockReturnThis()
      const eqMock = vi.fn().mockResolvedValue({ error: null })

      mockSupabase.from = vi.fn((table) => {
        if (table === 'purchase_orders') {
          return {
            update: updateMock,
            eq: eqMock,
          }
        }
        if (table === 'purchase_order_items') {
          return {
            delete: deleteMock,
            insert: vi.fn().mockResolvedValue({ error: null }),
            eq: eqMock,
          }
        }
        return {}
      }) as any

      await updatePurchaseOrder(1, formData)

      expect(mockSupabase.from).toHaveBeenCalledWith('purchase_orders')
      expect(mockSupabase.from).toHaveBeenCalledWith('purchase_order_items')
      expect(revalidatePath).toHaveBeenCalledWith('/purchase-orders')
      expect(revalidatePath).toHaveBeenCalledWith('/purchase-orders/1')
      expect(redirect).toHaveBeenCalledWith('/purchase-orders/1')
    })
  })

  // ทดสอบการลบใบสั่งซื้อ
  // Test deleting purchase orders
  describe('deletePurchaseOrder', () => {
    // ทดสอบ: ลบใบสั่งซื้อสำเร็จและ redirect
    // Test: Successfully deletes a purchase order and redirects
    it('successfully deletes a purchase order and redirects', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      const deleteMock = vi.fn().mockReturnThis()
      const eqMock = vi.fn().mockResolvedValue({ error: null })

      mockSupabase.from = vi.fn(() => ({
        delete: deleteMock,
        eq: eqMock,
      })) as any

      await deletePurchaseOrder(1)

      expect(mockSupabase.from).toHaveBeenCalledWith('purchase_orders')
      expect(deleteMock).toHaveBeenCalled()
      expect(eqMock).toHaveBeenCalledWith('id', 1)
      expect(revalidatePath).toHaveBeenCalledWith('/purchase-orders')
      expect(redirect).toHaveBeenCalledWith('/purchase-orders')
    })
  })

  // ทดสอบการอัปเดตสถานะใบสั่งซื้อ
  // Test updating purchase order status
  describe('updatePurchaseOrderStatus', () => {
    // ทดสอบ: อัปเดตสถานะสำเร็จ
    // Test: Successfully updates status
    it('successfully updates purchase order status', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      const updateMock = vi.fn().mockReturnThis()
      const eqMock = vi.fn().mockResolvedValue({ error: null })

      mockSupabase.from = vi.fn(() => ({
        update: updateMock,
        eq: eqMock,
      })) as any

      const result = await updatePurchaseOrderStatus(1, 'sent')

      expect(result).toEqual({ success: true })
      expect(updateMock).toHaveBeenCalledWith({ status: 'sent' })
      expect(revalidatePath).toHaveBeenCalledWith('/purchase-orders')
      expect(revalidatePath).toHaveBeenCalledWith('/purchase-orders/1')
    })

    // ทดสอบ: จัดการ error เมื่ออัปเดตสถานะล้มเหลว
    // Test: Handles errors when status update fails
    it('returns error when status update fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      const updateMock = vi.fn().mockReturnThis()
      const eqMock = vi.fn().mockResolvedValue({
        error: { message: 'Update failed' },
      })

      mockSupabase.from = vi.fn(() => ({
        update: updateMock,
        eq: eqMock,
      })) as any

      const result = await updatePurchaseOrderStatus(1, 'sent')

      expect(result).toEqual({ error: 'Failed to update status' })
    })
  })

  // ทดสอบการรับสินค้าเข้าสต็อก
  // Test receiving order items
  describe('receiveOrderItems', () => {
    // ทดสอบ: รับสินค้าเข้าสต็อกสำเร็จ
    // Test: Successfully receives items into inventory
    it('successfully receives items into inventory', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      // Mock fetching PO items
      const selectMock = vi.fn().mockReturnThis()
      const eqMock = vi.fn().mockResolvedValue({
        data: [
          { product_id: 1, quantity: 10, unit_price: 100, description: 'Test Product' },
        ],
        error: null,
      })

      mockSupabase.from = vi.fn((table) => {
        if (table === 'purchase_order_items') {
          return { select: selectMock, eq: eqMock }
        }
        if (table === 'purchase_orders') {
          return {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        return {}
      }) as any

      // Mock RPC calls for inventory updates
      mockSupabase.rpc = vi.fn().mockResolvedValue({ error: null })

      const result = await receiveOrderItems(1, 1)

      expect(result).toEqual({ success: true })
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'adjust_inventory_in_warehouse',
        expect.any(Object)
      )
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'record_stock_movement',
        expect.any(Object)
      )
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'record_inventory_cost',
        expect.any(Object)
      )
      expect(revalidatePath).toHaveBeenCalledWith('/purchase-orders')
      expect(revalidatePath).toHaveBeenCalledWith('/purchase-orders/1')
      expect(revalidatePath).toHaveBeenCalledWith('/products')
    })

    // ทดสอบ: จัดการ error เมื่อไม่มีสิทธิ์
    // Test: Returns error when not authenticated
    it('returns error when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await receiveOrderItems(1, 1)

      expect(result).toEqual({ error: 'Authentication required' })
    })
  })
})
