// ไฟล์ทดสอบสำหรับ Actions ของซัพพลายเออร์ (Suppliers)
// Test file for Supplier Actions
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { addSupplier, updateSupplier, deleteSupplier } from './actions'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// จำลอง (Mock) dependencies ที่จำเป็น
// Mock necessary dependencies
vi.mock('@/lib/supabase/server')
vi.mock('next/navigation')
vi.mock('next/cache')

// ชุดทดสอบสำหรับ Actions ของซัพพลายเออร์
// Test suite for Supplier Actions
describe('Supplier Actions', () => {
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

  // ทดสอบการเพิ่มซัพพลายเออร์ใหม่
  // Test adding new suppliers
  describe('addSupplier', () => {
    // ทดสอบ: ต้อง redirect ไปหน้า login ถ้าผู้ใช้ยังไม่ได้ล็อกอิน
    // Test: Should redirect to login if user is not authenticated
    it('redirects to login if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const formData = new FormData()
      formData.append('name', 'Test Supplier')

      await addSupplier(formData)

      expect(redirect).toHaveBeenCalledWith('/login')
    })

    // ทดสอบ: เพิ่มซัพพลายเออร์ใหม่สำเร็จและ redirect
    // Test: Successfully adds a supplier and redirects
    it('successfully adds a supplier and redirects', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      const formData = new FormData()
      formData.append('name', 'Test Supplier Co.')
      formData.append('taxId', '1234567890123')
      formData.append('address', '123 Supplier St')
      formData.append('phone', '0812345678')
      formData.append('email', 'supplier@test.com')
      formData.append('lineId', 'test-line')
      formData.append('contactPerson', 'Jane Doe')
      formData.append('notes', 'Reliable supplier')

      await addSupplier(formData)

      expect(mockSupabase.from).toHaveBeenCalledWith('suppliers')
      expect(revalidatePath).toHaveBeenCalledWith('/suppliers')
      expect(redirect).toHaveBeenCalledWith('/suppliers')
    })

    // ทดสอบ: จัดการ error เมื่อเพิ่มซัพพลายเออร์ล้มเหลว
    // Test: Handles errors when adding supplier fails
    it('handles errors when adding supplier fails', async () => {
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
      formData.append('name', 'Test Supplier')

      await addSupplier(formData)

      expect(redirect).toHaveBeenCalledWith(
        '/suppliers?message=Error: Could not add supplier.'
      )
    })
  })

  // ทดสอบการแก้ไขซัพพลายเออร์
  // Test updating suppliers
  describe('updateSupplier', () => {
    // ทดสอบ: ต้อง redirect ไปหน้า login ถ้าผู้ใช้ยังไม่ได้ล็อกอิน
    // Test: Should redirect to login if user is not authenticated
    it('redirects to login if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const formData = new FormData()
      formData.append('name', 'Updated Supplier')

      await updateSupplier(1, formData)

      expect(redirect).toHaveBeenCalledWith('/login?message=Authentication required')
    })

    // ทดสอบ: แก้ไขซัพพลายเออร์สำเร็จและ redirect
    // Test: Successfully updates a supplier and redirects
    it('successfully updates a supplier and redirects', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      const formData = new FormData()
      formData.append('name', 'Updated Supplier Name')
      formData.append('taxId', '9876543210987')
      formData.append('address', '456 New Address')
      formData.append('phone', '0898765432')
      formData.append('email', 'updated@test.com')
      formData.append('lineId', 'updated-line')
      formData.append('contactPerson', 'John Updated')
      formData.append('notes', 'Updated notes')

      await updateSupplier(1, formData)

      expect(mockSupabase.from).toHaveBeenCalledWith('suppliers')
      expect(revalidatePath).toHaveBeenCalledWith('/suppliers')
      expect(revalidatePath).toHaveBeenCalledWith('/suppliers/1')
      expect(redirect).toHaveBeenCalledWith('/suppliers')
    })

    // ทดสอบ: จัดการ error เมื่อแก้ไขซัพพลายเออร์ล้มเหลว
    // Test: Handles errors when updating supplier fails
    it('handles errors when updating supplier fails', async () => {
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
      formData.append('name', 'Updated Supplier')

      await updateSupplier(1, formData)

      expect(redirect).toHaveBeenCalledWith(
        '/suppliers/1?message=Error: Could not update supplier.'
      )
    })
  })

  // ทดสอบการลบซัพพลายเออร์
  // Test deleting suppliers
  describe('deleteSupplier', () => {
    // ทดสอบ: ต้อง redirect ไปหน้า login ถ้าผู้ใช้ยังไม่ได้ล็อกอิน
    // Test: Should redirect to login if user is not authenticated
    it('redirects to login if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      await deleteSupplier(1)

      expect(redirect).toHaveBeenCalledWith('/login')
    })

    // ทดสอบ: ลบซัพพลายเออร์สำเร็จและ redirect
    // Test: Successfully deletes a supplier and redirects
    it('successfully deletes a supplier and redirects', async () => {
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

      await deleteSupplier(1)

      expect(mockSupabase.from).toHaveBeenCalledWith('suppliers')
      expect(deleteMock).toHaveBeenCalled()
      expect(eqMock).toHaveBeenCalledWith('id', 1)
      expect(revalidatePath).toHaveBeenCalledWith('/suppliers')
      expect(redirect).toHaveBeenCalledWith('/suppliers')
    })

    // ทดสอบ: จัดการ error เมื่อลบซัพพลายเออร์ล้มเหลว
    // Test: Handles errors when deleting supplier fails
    it('handles errors when deleting supplier fails', async () => {
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

      await deleteSupplier(1)

      expect(redirect).toHaveBeenCalledWith(
        '/suppliers?message=Error deleting supplier'
      )
    })
  })
})
