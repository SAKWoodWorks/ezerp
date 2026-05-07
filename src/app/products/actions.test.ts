// ไฟล์ทดสอบสำหรับ Actions ของสินค้า (Products)
// Test file for Product Actions
// ทดสอบการเพิ่ม แก้ไข ลบ ปรับสต็อก และโอนย้ายสินค้า
// Tests adding, updating, deleting, adjusting stock, and transferring products
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  addProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
  transferStock,
} from './actions'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// จำลอง (Mock) dependencies ที่จำเป็น
// Mock necessary dependencies
vi.mock('@/lib/supabase/server')
vi.mock('next/navigation')
vi.mock('next/cache')

// ชุดทดสอบสำหรับ Actions ของสินค้า
// Test suite for Product Actions
describe('Product Actions', () => {
  // สร้าง Mock Supabase Client สำหรับการทดสอบ
  // Create Mock Supabase Client for testing
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    })),
    rpc: vi.fn().mockResolvedValue({ error: null }),
  }

  // ก่อนแต่ละ test ให้ล้าง mock ทั้งหมด
  // Clear all mocks before each test
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  // ทดสอบการเพิ่มสินค้าใหม่
  // Test adding new products
  describe('addProduct', () => {
    // ทดสอบ: ต้อง redirect ไปหน้า login ถ้าผู้ใช้ยังไม่ได้ล็อกอิน
    // Test: Should redirect to login if user is not authenticated
    it('redirects to login if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const formData = new FormData()
      formData.append('name', 'Test Product')

      await addProduct(formData)

      expect(redirect).toHaveBeenCalledWith('/login')
    })

    // ทดสอบ: เพิ่มสินค้าทั่วไปสำเร็จ
    // Test: Successfully adds a regular product
    it('successfully adds a regular product', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      const formData = new FormData()
      formData.append('name', 'Wood Panel')
      formData.append('description', 'High quality wood')
      formData.append('price', '1500')
      formData.append('stock_quantity', '100')
      formData.append('low_stock_threshold', '10')
      formData.append('width', '120')
      formData.append('length', '240')
      formData.append('thickness', '18')
      formData.append('is_ecommerce_product', 'false')
      formData.append('ecommerce_sizes', 'null')

      await addProduct(formData)

      expect(mockSupabase.from).toHaveBeenCalledWith('products')
      expect(revalidatePath).toHaveBeenCalledWith('/products')
      expect(redirect).toHaveBeenCalledWith('/products')
    })

    // ทดสอบ: เพิ่มสินค้า e-commerce ที่มีขนาดสำเร็จ
    // Test: Successfully adds an e-commerce product with sizes
    it('successfully adds an e-commerce product with sizes', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      const formData = new FormData()
      formData.append('name', 'E-commerce Item')
      formData.append('description', 'Product with sizes')
      formData.append('price', '500')
      formData.append('stock_quantity', '50')
      formData.append('low_stock_threshold', '5')
      formData.append('width', '10')
      formData.append('length', '20')
      formData.append('thickness', '5')
      formData.append('is_ecommerce_product', 'true')
      formData.append('ecommerce_sizes', JSON.stringify([10, 20, 30]))

      await addProduct(formData)

      expect(mockSupabase.from).toHaveBeenCalledWith('products')
      expect(redirect).toHaveBeenCalledWith('/products')
    })

    // ทดสอบ: จัดการ error เมื่อเพิ่มสินค้าล้มเหลว
    // Test: Handles errors when adding product fails
    it('handles errors when adding product fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      const insertMock = vi.fn().mockResolvedValue({
        error: { message: 'Database error' },
      })

      mockSupabase.from = vi.fn(() => ({
        insert: insertMock,
      })) as any

      const formData = new FormData()
      formData.append('name', 'Test Product')
      formData.append('price', '100')

      await addProduct(formData)

      expect(redirect).toHaveBeenCalledWith(
        '/products?message=Error: Could not add product.'
      )
    })
  })

  // ทดสอบการแก้ไขสินค้า
  // Test updating products
  describe('updateProduct', () => {
    // ทดสอบ: ต้อง redirect ไปหน้า login ถ้าผู้ใช้ยังไม่ได้ล็อกอิน
    // Test: Should redirect to login if user is not authenticated
    it('redirects to login if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const formData = new FormData()
      await updateProduct(1, formData)

      expect(redirect).toHaveBeenCalledWith('/login')
    })

    // ทดสอบ: แก้ไขสินค้าสำเร็จ
    // Test: Successfully updates a product
    it('successfully updates a product', async () => {
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

      const formData = new FormData()
      formData.append('name', 'Updated Product')
      formData.append('description', 'Updated description')
      formData.append('price', '2000')
      formData.append('low_stock_threshold', '15')
      formData.append('width', '150')
      formData.append('length', '300')
      formData.append('thickness', '20')
      formData.append('is_ecommerce_product', 'false')
      formData.append('ecommerce_sizes', 'null')

      await updateProduct(1, formData)

      expect(mockSupabase.from).toHaveBeenCalledWith('products')
      expect(updateMock).toHaveBeenCalled()
      expect(eqMock).toHaveBeenCalledWith('id', 1)
      expect(revalidatePath).toHaveBeenCalledWith('/products')
      expect(revalidatePath).toHaveBeenCalledWith('/products/1')
      expect(redirect).toHaveBeenCalledWith('/products/1')
    })

    // ทดสอบ: จัดการ error เมื่อแก้ไขสินค้าล้มเหลว
    // Test: Handles errors when updating product fails
    it('handles errors when updating product fails', async () => {
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

      const formData = new FormData()
      formData.append('name', 'Product')

      await updateProduct(1, formData)

      expect(redirect).toHaveBeenCalledWith(
        '/products/1?message=Error updating product'
      )
    })
  })

  // ทดสอบการลบสินค้า
  // Test deleting products
  describe('deleteProduct', () => {
    // ทดสอบ: ต้อง redirect ไปหน้า login ถ้าผู้ใช้ยังไม่ได้ล็อกอิน
    // Test: Should redirect to login if user is not authenticated
    it('redirects to login if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      await deleteProduct(1)

      expect(redirect).toHaveBeenCalledWith('/login')
    })

    // ทดสอบ: ลบสินค้าสำเร็จ
    // Test: Successfully deletes a product
    it('successfully deletes a product', async () => {
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

      await deleteProduct(1)

      expect(mockSupabase.from).toHaveBeenCalledWith('products')
      expect(deleteMock).toHaveBeenCalled()
      expect(eqMock).toHaveBeenCalledWith('id', 1)
      expect(revalidatePath).toHaveBeenCalledWith('/products')
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard')
      expect(redirect).toHaveBeenCalledWith('/products')
    })

    // ทดสอบ: จัดการ error เมื่อลบสินค้าล้มเหลว
    // Test: Handles errors when deleting product fails
    it('handles errors when deleting product fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      const deleteMock = vi.fn().mockReturnThis()
      const eqMock = vi.fn().mockResolvedValue({
        error: { message: 'Delete failed' },
      })

      mockSupabase.from = vi.fn(() => ({
        delete: deleteMock,
        eq: eqMock,
      })) as any

      await deleteProduct(1)

      expect(redirect).toHaveBeenCalledWith(
        '/products?message=Error deleting product'
      )
    })
  })

  // ทดสอบการปรับสต็อกสินค้า
  // Test adjusting product stock
  describe('adjustStock', () => {
    // ทดสอบ: ต้องคืนค่า error ถ้าผู้ใช้ยังไม่ได้ยืนยันตัวตน
    // Test: Should return error if user is not authenticated
    it('returns error if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const formData = new FormData()
      const result = await adjustStock(formData)

      expect(result).toEqual({ error: 'Authentication required' })
    })

    // ทดสอบ: ปรับสต็อกในคลังสินค้าสำเร็จ
    // Test: Successfully adjusts stock in a warehouse
    it('successfully adjusts stock in a warehouse', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      mockSupabase.rpc.mockResolvedValue({ error: null })

      const formData = new FormData()
      formData.append('productId', '1')
      formData.append('warehouseId', '2')
      formData.append('type', 'adjustment')
      formData.append('quantityChange', '10')
      formData.append('notes', 'Stock recount')

      const result = await adjustStock(formData)

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'adjust_inventory_in_warehouse',
        {
          p_product_id: 1,
          p_warehouse_id: 2,
          p_quantity_change: 10,
        }
      )
      expect(mockSupabase.rpc).toHaveBeenCalledWith('record_stock_movement', {
        p_product_id: 1,
        p_invoice_id: null,
        p_type: 'adjustment',
        p_quantity_change: 10,
        p_notes: 'Stock recount',
        p_warehouse_id: 2,
      })
      expect(result).toEqual({ success: true })
    })

    // ทดสอบ: ตรวจสอบฟิลด์บังคับ
    // Test: Validates required fields
    it('validates required fields', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      const formData = new FormData()
      formData.append('productId', '')
      formData.append('warehouseId', '')

      const result = await adjustStock(formData)

      expect(result.error).toContain('Invalid data provided')
    })

    // ทดสอบ: จัดการ error จากการปรับสต็อก
    // Test: Handles inventory adjustment errors
    it('handles inventory adjustment errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      mockSupabase.rpc.mockResolvedValueOnce({
        error: { message: 'Insufficient stock' },
      })

      const formData = new FormData()
      formData.append('productId', '1')
      formData.append('warehouseId', '2')
      formData.append('type', 'sale')
      formData.append('quantityChange', '-100')
      formData.append('notes', 'Test')

      const result = await adjustStock(formData)

      expect(result).toEqual({ error: 'Could not adjust inventory.' })
    })
  })

  // ทดสอบการโอนย้ายสินค้าระหว่างคลัง
  // Test transferring stock between warehouses
  describe('transferStock', () => {
    // ทดสอบ: ต้องคืนค่า error ถ้าผู้ใช้ยังไม่ได้ยืนยันตัวตน
    // Test: Should return error if user is not authenticated
    it('returns error if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const formData = new FormData()
      const result = await transferStock(formData)

      expect(result).toEqual({ error: 'Authentication required' })
    })

    // ทดสอบ: โอนย้ายสินค้าระหว่างคลังสำเร็จ
    // Test: Successfully transfers stock between warehouses
    it('successfully transfers stock between warehouses', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      mockSupabase.rpc.mockResolvedValue({ error: null })

      const formData = new FormData()
      formData.append('productId', '1')
      formData.append('fromWarehouseId', '1')
      formData.append('toWarehouseId', '2')
      formData.append('quantity', '50')
      formData.append('notes', 'Transfer to main warehouse')

      const result = await transferStock(formData)

      expect(mockSupabase.rpc).toHaveBeenCalledWith('transfer_stock', {
        p_product_id: 1,
        p_quantity: 50,
        p_from_warehouse_id: 1,
        p_to_warehouse_id: 2,
        p_notes: 'Transfer to main warehouse',
      })
      expect(revalidatePath).toHaveBeenCalledWith('/products')
      expect(revalidatePath).toHaveBeenCalledWith('/products/1')
      expect(result).toEqual({ success: true })
    })

    // ทดสอบ: ตรวจสอบว่าคลังต้นทางและปลายทางแตกต่างกัน
    // Test: Validates that warehouses are different
    it('validates that warehouses are different', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      const formData = new FormData()
      formData.append('productId', '1')
      formData.append('fromWarehouseId', '1')
      formData.append('toWarehouseId', '1')
      formData.append('quantity', '50')

      const result = await transferStock(formData)

      expect(result.error).toBe('คลังสินค้าต้นทางและปลายทางต้องแตกต่างกัน')
    })

    // ทดสอบ: ตรวจสอบฟิลด์บังคับ
    // Test: Validates required fields
    it('validates required fields', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      const formData = new FormData()
      formData.append('productId', '1')

      const result = await transferStock(formData)

      expect(result.error).toBe('ข้อมูลไม่ครบถ้วน')
    })

    // ทดสอบ: จัดการ error จากการโอนย้าย
    // Test: Handles transfer errors
    it('handles transfer errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      mockSupabase.rpc.mockResolvedValue({
        error: { message: 'Insufficient stock' },
      })

      const formData = new FormData()
      formData.append('productId', '1')
      formData.append('fromWarehouseId', '1')
      formData.append('toWarehouseId', '2')
      formData.append('quantity', '1000')
      formData.append('notes', 'Test')

      const result = await transferStock(formData)

      expect(result).toEqual({ error: 'ไม่สามารถย้ายสินค้าได้' })
    })
  })
})
