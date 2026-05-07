// ไฟล์ทดสอบสำหรับ Actions ของพนักงาน (Employees)
// Test file for Employee Actions
// ทดสอบการเพิ่มและแก้ไขข้อมูลพนักงาน
// Tests adding and updating employee data
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { addEmployee, updateEmployee } from './actions'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// จำลอง (Mock) dependencies ที่จำเป็น
// Mock necessary dependencies
vi.mock('@/lib/supabase/server')
vi.mock('next/navigation')
vi.mock('next/cache')

// ชุดทดสอบสำหรับ Actions ของพนักงาน
// Test suite for Employee Actions
describe('Employee Actions', () => {
  // สร้าง Mock Supabase Client สำหรับการทดสอบ
  // Create Mock Supabase Client for testing
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    rpc: vi.fn().mockResolvedValue({ error: null }),
  }

  // ก่อนแต่ละ test ให้ล้าง mock ทั้งหมด
  // Clear all mocks before each test
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  // ทดสอบการเพิ่มพนักงานใหม่
  // Test adding new employees
  describe('addEmployee', () => {
    // ทดสอบ: ต้อง redirect ไปหน้า login ถ้าผู้ใช้ยังไม่ได้ล็อกอิน
    // Test: Should redirect to login if user is not authenticated
    it('redirects to login if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const formData = new FormData()
      await addEmployee(formData)

      expect(redirect).toHaveBeenCalledWith('/login')
    })

    // ทดสอบ: เพิ่มพนักงานสำเร็จและเริ่มต้นยอดวันลา
    // Test: Successfully adds an employee and initializes leave balances
    it('successfully adds an employee and initializes leave balances', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      const insertMock = vi.fn().mockReturnThis()
      const selectMock = vi.fn().mockReturnThis()
      const singleMock = vi.fn().mockResolvedValue({
        data: { id: 100 },
        error: null,
      })

      mockSupabase.from = vi.fn(() => ({
        insert: insertMock,
        select: selectMock,
        single: singleMock,
      })) as any

      mockSupabase.rpc.mockResolvedValue({ error: null })

      const formData = new FormData()
      formData.append('fullName', 'John Doe')
      formData.append('position', 'Manager')
      formData.append('startDate', '2025-01-01')
      formData.append('warehouseId', '1')

      await addEmployee(formData)

      expect(mockSupabase.from).toHaveBeenCalledWith('employees')
      expect(insertMock).toHaveBeenCalled()
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'initialize_employee_leave_balances',
        {
          p_employee_id: 100,
          p_year: new Date().getFullYear(),
        }
      )
      expect(revalidatePath).toHaveBeenCalledWith('/employees')
      expect(redirect).toHaveBeenCalledWith('/employees')
    })

    // ทดสอบ: จัดการ error เมื่อเพิ่มพนักงานล้มเหลว
    // Test: Handles errors when adding employee fails
    it('handles errors when adding employee fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      const insertMock = vi.fn().mockReturnThis()
      const selectMock = vi.fn().mockReturnThis()
      const singleMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      mockSupabase.from = vi.fn(() => ({
        insert: insertMock,
        select: selectMock,
        single: singleMock,
      })) as any

      const formData = new FormData()
      formData.append('fullName', 'John Doe')

      await addEmployee(formData)

      expect(redirect).toHaveBeenCalledWith(
        '/employees?message=Error: Could not add employee.'
      )
    })

    // ทดสอบ: จัดการการกำหนดคลังสินค้าให้พนักงานอย่างถูกต้อง
    // Test: Handles warehouse assignment correctly
    it('handles warehouse assignment correctly', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      const insertMock = vi.fn().mockReturnThis()
      const selectMock = vi.fn().mockReturnThis()
      const singleMock = vi.fn().mockResolvedValue({
        data: { id: 101 },
        error: null,
      })

      mockSupabase.from = vi.fn(() => ({
        insert: insertMock,
        select: selectMock,
        single: singleMock,
      })) as any

      const formData = new FormData()
      formData.append('fullName', 'Jane Doe')
      formData.append('position', 'Warehouse Staff')
      formData.append('startDate', '2025-01-15')
      formData.append('warehouseId', '2')

      await addEmployee(formData)

      expect(mockSupabase.from).toHaveBeenCalledWith('employees')
      expect(revalidatePath).toHaveBeenCalledWith('/employees')
    })
  })

  // ทดสอบการแก้ไขข้อมูลพนักงาน
  // Test updating employee data
  describe('updateEmployee', () => {
    // ทดสอบ: ต้องคืนค่า error ถ้าผู้ใช้ยังไม่ได้ยืนยันตัวตน
    // Test: Should return error if user is not authenticated
    it('redirects to login if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const formData = new FormData()
      const result = await updateEmployee(1, formData)

      expect(result).toEqual({
        success: false,
        error: 'Authentication required.',
      })
    })

    // ทดสอบ: แก้ไขข้อมูลพนักงานสำเร็จ
    // Test: Successfully updates an employee
    it('successfully updates an employee', async () => {
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
      formData.append('fullName', 'Updated Name')
      formData.append('position', 'Senior Manager')
      formData.append('startDate', '2024-01-01')
      formData.append('warehouseId', '3')

      const result = await updateEmployee(1, formData)

      expect(mockSupabase.from).toHaveBeenCalledWith('employees')
      expect(updateMock).toHaveBeenCalled()
      expect(eqMock).toHaveBeenCalledWith('id', 1)
      expect(revalidatePath).toHaveBeenCalledWith('/employees')
      expect(revalidatePath).toHaveBeenCalledWith('/employees/1')
      expect(result).toEqual({ success: true })
    })

    // ทดสอบ: จัดการ error จากการอัพเดทฐานข้อมูล
    // Test: Handles database update errors
    it('handles database update errors', async () => {
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
      formData.append('fullName', 'Test')

      const result = await updateEmployee(1, formData)

      expect(result).toEqual({
        success: false,
        error: 'Update failed',
      })
    })
  })
})
