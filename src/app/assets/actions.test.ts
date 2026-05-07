// ไฟล์ทดสอบสำหรับ Actions ของอุปกรณ์สำนักงาน (Office Assets)
// Test file for Office Assets Actions
// ทดสอบการเพิ่ม แก้ไข และมอบหมายอุปกรณ์สำนักงาน
// Tests adding, updating, and assigning office assets
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { addAsset, updateAsset, assignAsset } from './actions'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// จำลอง (Mock) dependencies ที่จำเป็น
// Mock necessary dependencies
vi.mock('@/lib/supabase/server')
vi.mock('next/cache')

// ชุดทดสอบสำหรับ Actions ของอุปกรณ์สำนักงาน
// Test suite for Asset Actions
describe('Asset Actions', () => {
  // สร้าง Mock Supabase Client สำหรับการทดสอบ
  // Create Mock Supabase Client for testing
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    })),
    rpc: vi.fn(() => ({
      single: vi.fn().mockResolvedValue({ data: 'AST-001', error: null }),
    })),
  }

  // ก่อนแต่ละ test ให้ล้าง mock ทั้งหมด
  // Clear all mocks before each test
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  // ทดสอบการเพิ่มอุปกรณ์สำนักงานใหม่
  // Test adding new office assets
  describe('addAsset', () => {
    // ทดสอบ: ต้องคืนค่า error ถ้าผู้ใช้ยังไม่ได้ยืนยันตัวตน
    // Test: Should return error if user is not authenticated
    it('returns error if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const formData = new FormData()
      const result = await addAsset(formData)

      expect(result).toEqual({ error: 'Authentication required' })
    })

    // ทดสอบ: เพิ่มอุปกรณ์ใหม่สำเร็จพร้อมสร้างรหัสทรัพย์สินอัตโนมัติ
    // Test: Successfully adds a new asset with auto-generated tag
    it('successfully adds a new asset with auto-generated tag', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      mockSupabase.rpc = vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: 'AST-050', error: null }),
      })) as any

      mockSupabase.from = vi.fn(() => ({
        insert: vi.fn().mockResolvedValue({ error: null }),
      })) as any

      const formData = new FormData()
      formData.append('type', 'Laptop')
      formData.append('model', 'Dell XPS 15')
      formData.append('serial_number', 'SN123456')
      formData.append('purchase_date', '2025-01-01')
      formData.append('purchase_price', '50000')
      formData.append('notes', 'For development team')
      formData.append('warehouseId', '1')

      const result = await addAsset(formData)

      expect(mockSupabase.rpc).toHaveBeenCalledWith('generate_next_asset_tag')
      expect(mockSupabase.from).toHaveBeenCalledWith('office_assets')
      expect(revalidatePath).toHaveBeenCalledWith('/assets')
      expect(result).toEqual({ success: true })
    })

    // ทดสอบ: ตรวจสอบฟิลด์บังคับ (ประเภทและคลังสินค้า)
    // Test: Validates required fields (type and warehouse)
    it('validates required fields (type and warehouse)', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      mockSupabase.rpc = vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: 'AST-001', error: null }),
      })) as any

      const formData = new FormData()
      formData.append('model', 'Some Model')

      const result = await addAsset(formData)

      expect(result).toEqual({ error: 'Type and Warehouse are required.' })
    })

    // ทดสอบ: จัดการ error เมื่อการสร้างรหัสทรัพย์สินล้มเหลว
    // Test: Handles error when generating asset tag fails
    it('handles error when generating asset tag fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      mockSupabase.rpc = vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'RPC error' },
        }),
      })) as any

      const formData = new FormData()
      formData.append('type', 'Laptop')
      formData.append('warehouseId', '1')

      const result = await addAsset(formData)

      expect(result).toEqual({ error: 'Could not generate a new asset tag.' })
    })

    // ทดสอบ: จัดการ error จากการเพิ่มข้อมูลลงฐานข้อมูล
    // Test: Handles database insert errors
    it('handles database insert errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      mockSupabase.rpc = vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: 'AST-001', error: null }),
      })) as any

      mockSupabase.from = vi.fn(() => ({
        insert: vi.fn().mockResolvedValue({
          error: { message: 'Insert failed' },
        }),
      })) as any

      const formData = new FormData()
      formData.append('type', 'Monitor')
      formData.append('warehouseId', '1')

      const result = await addAsset(formData)

      expect(result).toEqual({ error: 'Could not add asset.' })
    })
  })

  // ทดสอบการแก้ไขอุปกรณ์สำนักงาน
  // Test updating office assets
  describe('updateAsset', () => {
    // ทดสอบ: ต้องคืนค่า error ถ้าผู้ใช้ยังไม่ได้ยืนยันตัวตน
    // Test: Should return error if user is not authenticated
    it('returns error if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const formData = new FormData()
      const result = await updateAsset(1, formData)

      expect(result).toEqual({ error: 'Authentication required' })
    })

    // ทดสอบ: แก้ไขข้อมูลอุปกรณ์สำเร็จ
    // Test: Successfully updates an asset
    it('successfully updates an asset', async () => {
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
      formData.append('type', 'Desktop')
      formData.append('model', 'HP EliteDesk')
      formData.append('serial_number', 'SN789012')
      formData.append('purchase_date', '2024-12-01')
      formData.append('purchase_price', '35000')
      formData.append('notes', 'Updated notes')
      formData.append('warehouseId', '2')

      const result = await updateAsset(1, formData)

      expect(mockSupabase.from).toHaveBeenCalledWith('office_assets')
      expect(updateMock).toHaveBeenCalled()
      expect(eqMock).toHaveBeenCalledWith('id', 1)
      expect(revalidatePath).toHaveBeenCalledWith('/assets')
      expect(revalidatePath).toHaveBeenCalledWith('/assets/1')
      expect(result).toEqual({ success: true })
    })

    it('validates required fields', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      const formData = new FormData()
      formData.append('model', 'Some Model')

      const result = await updateAsset(1, formData)

      expect(result).toEqual({ error: 'Type and Warehouse are required.' })
    })
  })

  // ทดสอบการมอบหมายอุปกรณ์ให้กับพนักงาน
  // Test assigning assets to employees
  describe('assignAsset', () => {
    // ทดสอบ: ต้องคืนค่า error ถ้าผู้ใช้ยังไม่ได้ยืนยันตัวตน
    // Test: Should return error if user is not authenticated
    it('returns error if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const formData = new FormData()
      const result = await assignAsset(formData)

      expect(result).toEqual({ error: 'Authentication required' })
    })

    // ทดสอบ: มอบหมายอุปกรณ์ให้พนักงานสำเร็จ
    // Test: Successfully assigns an asset to an employee
    it('successfully assigns an asset to an employee', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      const insertMock = vi.fn().mockResolvedValue({ error: null })
      const updateMock = vi.fn().mockReturnThis()
      const eqMock = vi.fn().mockResolvedValue({ error: null })

      mockSupabase.from = vi.fn()
        .mockReturnValueOnce({ insert: insertMock })
        .mockReturnValueOnce({
          update: updateMock,
          eq: eqMock,
        }) as any

      const formData = new FormData()
      formData.append('assetId', '10')
      formData.append('employeeId', '5')

      const result = await assignAsset(formData)

      expect(mockSupabase.from).toHaveBeenCalledWith('asset_assignments')
      expect(insertMock).toHaveBeenCalled()
      expect(mockSupabase.from).toHaveBeenCalledWith('office_assets')
      expect(updateMock).toHaveBeenCalledWith({ status: 'Assigned' })
      expect(revalidatePath).toHaveBeenCalledWith('/assets')
      expect(revalidatePath).toHaveBeenCalledWith('/assets/10')
      expect(revalidatePath).toHaveBeenCalledWith('/employees/5')
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

      const result = await assignAsset(formData)

      expect(result).toEqual({ error: 'Asset and Employee are required.' })
    })

    // ทดสอบ: จัดการ error จากการสร้างบันทึกการมอบหมาย
    // Test: Handles assignment creation errors
    it('handles assignment creation errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      mockSupabase.from = vi.fn(() => ({
        insert: vi.fn().mockResolvedValue({
          error: { message: 'Assignment failed' },
        }),
      })) as any

      const formData = new FormData()
      formData.append('assetId', '10')
      formData.append('employeeId', '5')

      const result = await assignAsset(formData)

      expect(result).toEqual({ error: 'Could not create assignment record.' })
    })

    // ทดสอบ: จัดการ error จากการอัพเดทสถานะหลังจากมอบหมายสำเร็จ
    // Test: Handles status update errors after successful assignment
    it('handles status update errors after successful assignment', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      const insertMock = vi.fn().mockResolvedValue({ error: null })
      const updateMock = vi.fn().mockReturnThis()
      const eqMock = vi.fn().mockResolvedValue({
        error: { message: 'Update failed' },
      })

      mockSupabase.from = vi.fn()
        .mockReturnValueOnce({ insert: insertMock })
        .mockReturnValueOnce({
          update: updateMock,
          eq: eqMock,
        }) as any

      const formData = new FormData()
      formData.append('assetId', '10')
      formData.append('employeeId', '5')

      const result = await assignAsset(formData)

      expect(result).toEqual({
        error: 'Assignment created, but failed to update asset status.',
      })
    })
  })
})
