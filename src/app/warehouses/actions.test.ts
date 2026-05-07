// ไฟล์ทดสอบสำหรับ Actions ของคลังสินค้า (Warehouses)
// Test file for Warehouse Actions
// ทดสอบการเพิ่ม แก้ไข และลบคลังสินค้า
// Tests adding, updating, and deleting warehouses
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { addWarehouse, updateWarehouse, deleteWarehouse } from './actions'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// จำลอง (Mock) dependencies ที่จำเป็น
// Mock necessary dependencies
vi.mock('@/lib/supabase/server')
vi.mock('next/navigation')
vi.mock('next/cache')

// ชุดทดสอบสำหรับ Actions ของคลังสินค้า
// Test suite for Warehouse Actions
describe('Warehouse Actions', () => {
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
  }

  // ก่อนแต่ละ test ให้ล้าง mock ทั้งหมด
  // Clear all mocks before each test
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  // ทดสอบการเพิ่มคลังสินค้าใหม่
  // Test adding new warehouses
  describe('addWarehouse', () => {
    // ทดสอบ: ต้อง redirect ไปหน้า login ถ้าผู้ใช้ยังไม่ได้ล็อกอิน
    // Test: Should redirect to login if user is not authenticated
    it('redirects to login if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const formData = new FormData()
      await addWarehouse(formData)

      expect(redirect).toHaveBeenCalledWith('/login')
    })

    // ทดสอบ: เพิ่มคลังสินค้าใหม่สำเร็จ
    // Test: Successfully adds a new warehouse
    it('successfully adds a new warehouse', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      const insertMock = vi.fn().mockResolvedValue({ error: null })

      mockSupabase.from = vi.fn(() => ({
        insert: insertMock,
      })) as any

      const formData = new FormData()
      formData.append('name', 'Main Warehouse')
      formData.append('address', '123 Industrial St, Bangkok')

      await addWarehouse(formData)

      expect(mockSupabase.from).toHaveBeenCalledWith('warehouses')
      expect(insertMock).toHaveBeenCalledWith({
        name: 'Main Warehouse',
        address: '123 Industrial St, Bangkok',
      })
      expect(revalidatePath).toHaveBeenCalledWith('/warehouses')
      expect(redirect).toHaveBeenCalledWith('/warehouses')
    })

    // ทดสอบ: จัดการ error เมื่อเพิ่มคลังสินค้าล้มเหลว
    // Test: Handles errors when adding warehouse fails
    it('handles errors when adding warehouse fails', async () => {
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
      formData.append('name', 'Test Warehouse')

      await addWarehouse(formData)

      expect(redirect).toHaveBeenCalledWith(
        '/warehouses?message=Error: Could not add warehouse.'
      )
    })
  })

  // ทดสอบการแก้ไขคลังสินค้า
  // Test updating warehouses
  describe('updateWarehouse', () => {
    // ทดสอบ: ต้อง redirect ไปหน้า login ถ้าผู้ใช้ยังไม่ได้ล็อกอิน
    // Test: Should redirect to login if user is not authenticated
    it('redirects to login if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const formData = new FormData()
      await updateWarehouse(1, formData)

      expect(redirect).toHaveBeenCalledWith('/login')
    })

    // ทดสอบ: แก้ไขคลังสินค้าสำเร็จ
    // Test: Successfully updates a warehouse
    it('successfully updates a warehouse', async () => {
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
      formData.append('name', 'Updated Warehouse Name')
      formData.append('address', '456 New Address, Bangkok')

      await updateWarehouse(1, formData)

      expect(mockSupabase.from).toHaveBeenCalledWith('warehouses')
      expect(updateMock).toHaveBeenCalledWith({
        name: 'Updated Warehouse Name',
        address: '456 New Address, Bangkok',
      })
      expect(eqMock).toHaveBeenCalledWith('id', 1)
      expect(revalidatePath).toHaveBeenCalledWith('/warehouses')
      expect(revalidatePath).toHaveBeenCalledWith('/warehouses/1')
    })

    // ทดสอบ: จัดการ error เมื่อแก้ไขคลังสินค้าล้มเหลว
    // Test: Handles errors when updating warehouse fails
    it('handles errors when updating warehouse fails', async () => {
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
      formData.append('name', 'Test')

      await updateWarehouse(1, formData)

      // Still revalidates paths even on error
      expect(revalidatePath).toHaveBeenCalledWith('/warehouses')
      expect(revalidatePath).toHaveBeenCalledWith('/warehouses/1')
    })
  })

  // ทดสอบการลบคลังสินค้า
  // Test deleting warehouses
  describe('deleteWarehouse', () => {
    // ทดสอบ: ต้อง redirect ไปหน้า login ถ้าผู้ใช้ยังไม่ได้ล็อกอิน
    // Test: Should redirect to login if user is not authenticated
    it('redirects to login if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      await deleteWarehouse(1)

      expect(redirect).toHaveBeenCalledWith('/login')
    })

    // ทดสอบ: ลบคลังสินค้าสำเร็จ
    // Test: Successfully deletes a warehouse
    it('successfully deletes a warehouse', async () => {
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

      await deleteWarehouse(1)

      expect(mockSupabase.from).toHaveBeenCalledWith('warehouses')
      expect(deleteMock).toHaveBeenCalled()
      expect(eqMock).toHaveBeenCalledWith('id', 1)
      expect(revalidatePath).toHaveBeenCalledWith('/warehouses')
      expect(redirect).toHaveBeenCalledWith('/warehouses')
    })

    // ทดสอบ: จัดการ error เมื่อลบคลังสินค้าล้มเหลว
    // Test: Handles errors when deleting warehouse fails
    it('handles errors when deleting warehouse fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      const deleteMock = vi.fn().mockReturnThis()
      const eqMock = vi.fn().mockResolvedValue({
        error: { message: 'Cannot delete warehouse with existing inventory' },
      })

      mockSupabase.from = vi.fn(() => ({
        delete: deleteMock,
        eq: eqMock,
      })) as any

      await deleteWarehouse(1)

      // The function still redirects to /warehouses even on error
      // (it just logs the error but doesn't show it to the user)
      expect(redirect).toHaveBeenCalledWith('/warehouses')
    })
  })
})
