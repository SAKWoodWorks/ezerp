// ไฟล์ทดสอบสำหรับ Actions ของใบแจ้งหนี้ (Invoices)
// Test file for Invoice Actions
// ทดสอบการสร้าง แก้ไข และอัพเดทสถานะใบแจ้งหนี้
// Tests creating, updating, and changing invoice status
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  generateNextInvoiceNumber,
  addInvoice,
  updateInvoiceStatus,
  updateInvoice,
} from './actions'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// จำลอง (Mock) dependencies ที่จำเป็น
// Mock necessary dependencies
vi.mock('@/lib/supabase/server')
vi.mock('next/navigation')
vi.mock('next/cache')

// ชุดทดสอบสำหรับ Actions ของใบแจ้งหนี้
// Test suite for Invoice Actions
describe('Invoice Actions', () => {
  // สร้าง Mock Supabase Client สำหรับการทดสอบ
  // Create Mock Supabase Client for testing
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
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

  // ทดสอบการสร้างหมายเลขใบแจ้งหนี้ถัดไป
  // Test generating next invoice number
  describe('generateNextInvoiceNumber', () => {
    // ทดสอบ: คืนค่า 1 เมื่อไม่มีใบแจ้งหนี้สำหรับปีปัจจุบัน
    // Test: Returns 1 when no invoices exist for current year
    it('returns 1 when no invoices exist for current year', async () => {
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        like: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      })) as any

      const result = await generateNextInvoiceNumber()
      expect(result).toBe(1)
    })

    // ทดสอบ: เพิ่มหมายเลขใบแจ้งหนี้อย่างถูกต้อง
    // Test: Increments invoice number correctly
    it('increments invoice number correctly', async () => {
      const currentYear = new Date().getFullYear().toString().slice(-2)

      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        like: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { invoice_number: `INVNo${currentYear}005PW` },
          error: null,
        }),
      })) as any

      const result = await generateNextInvoiceNumber()
      expect(result).toBe(6)
    })

    // ทดสอบ: จัดการ error จากการแปลงข้อมูลอย่างเหมาะสม
    // Test: Handles parsing errors gracefully
    it('handles parsing errors gracefully', async () => {
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        like: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { invoice_number: 'INVALID' },
          error: null,
        }),
      })) as any

      const result = await generateNextInvoiceNumber()
      expect(result).toBe(1)
    })
  })

  // ทดสอบการสร้างใบแจ้งหนี้ใหม่
  // Test adding new invoices
  describe('addInvoice', () => {
    // ทดสอบ: ต้อง redirect ไปหน้า login ถ้าผู้ใช้ยังไม่ได้ล็อกอิน
    // Test: Should redirect to login if user is not authenticated
    it('redirects to login if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const formData = new FormData()
      await addInvoice('INVNo25001PW', formData)

      expect(redirect).toHaveBeenCalledWith('/login')
    })

    // ทดสอบ: ตรวจสอบการเลือกลูกค้า
    // Test: Validates customer selection
    it('validates customer selection', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      const formData = new FormData()
      // Not setting customerId

      await addInvoice('INVNo25001PW', formData)

      expect(redirect).toHaveBeenCalledWith(
        '/invoices/new?message=Error: Please select a customer.'
      )
    })

    // ทดสอบ: สร้างใบแจ้งหนี้สำเร็จ
    // Test: Successfully creates an invoice
    it('successfully creates an invoice', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      const insertMock = vi.fn().mockReturnThis()
      const selectMock = vi.fn().mockReturnThis()
      const singleMock = vi.fn().mockResolvedValue({
        data: { id: 100, customer_id: 1 },
        error: null,
      })

      mockSupabase.from = vi.fn(() => ({
        insert: insertMock,
        select: selectMock,
        single: singleMock,
      })) as any

      const items = [
        { description: 'Product 1', quantity: 10, unitPrice: 100 },
        { description: 'Product 2', quantity: 5, unitPrice: 200 },
      ]

      const formData = new FormData()
      formData.append('customerId', '1')
      formData.append('responsiblePersonId', '2')
      formData.append('priceTier', 'retail')
      formData.append('issueDate', '2025-01-01')
      formData.append('dueDate', '2025-01-31')
      formData.append('items', JSON.stringify(items))

      await addInvoice('INVNo25001PW', formData)

      expect(mockSupabase.from).toHaveBeenCalledWith('invoices')
      expect(insertMock).toHaveBeenCalled()
      expect(revalidatePath).toHaveBeenCalledWith('/invoices')
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard')
      expect(revalidatePath).toHaveBeenCalledWith('/customers/1')
      expect(redirect).toHaveBeenCalledWith('/invoices/100')
    })

    // ทดสอบ: จัดการข้อมูล JSON ที่ไม่ถูกต้อง
    // Test: Handles invalid JSON items data
    it('handles invalid JSON items data', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      const formData = new FormData()
      formData.append('customerId', '1')
      formData.append('items', 'invalid-json')

      await addInvoice('INVNo25001PW', formData)

      expect(redirect).toHaveBeenCalledWith(
        '/invoices/new?message=Error: Invalid items data.'
      )
    })

    // ทดสอบ: จัดการ error จากฐานข้อมูล
    // Test: Handles database errors
    it('handles database errors', async () => {
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
      formData.append('customerId', '1')
      formData.append('items', JSON.stringify([]))

      await addInvoice('INVNo25001PW', formData)

      expect(redirect).toHaveBeenCalledWith(
        '/invoices/new?message=Error: Could not add invoice.'
      )
    })
  })

  // ทดสอบการอัพเดทสถานะใบแจ้งหนี้
  // Test updating invoice status
  describe('updateInvoiceStatus', () => {
    // ทดสอบ: ต้องคืนค่า error ถ้าผู้ใช้ยังไม่ได้ยืนยันตัวตน
    // Test: Should return error if user is not authenticated
    it('returns error message if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await updateInvoiceStatus(1, 'Paid')

      expect(result).toEqual({ message: 'Authentication required' })
    })

    // ทดสอบ: อัพเดทสถานะใบแจ้งหนี้เป็น Draft หรือ Sent สำเร็จ
    // Test: Successfully updates invoice status to Draft or Sent
    it('successfully updates invoice status to Draft or Sent', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      const updateMock = vi.fn().mockReturnThis()
      const selectMock = vi.fn().mockReturnThis()
      const eqMock = vi.fn()
      const singleMock = vi.fn()

      // First eq call for update
      eqMock.mockReturnValueOnce(Promise.resolve({ error: null }))

      // Second from call for select
      mockSupabase.from = vi.fn()
        .mockReturnValueOnce({
          update: updateMock,
          eq: eqMock,
        })
        .mockReturnValueOnce({
          select: selectMock,
          eq: vi.fn().mockReturnThis(),
          single: singleMock.mockResolvedValue({
            data: { customer_id: 5 },
            error: null,
          }),
        }) as any

      const result = await updateInvoiceStatus(1, 'Sent')

      expect(updateMock).toHaveBeenCalledWith({ status: 'Sent' })
      expect(result).toEqual({ message: 'Success' })
      expect(revalidatePath).toHaveBeenCalledWith('/invoices')
      expect(revalidatePath).toHaveBeenCalledWith('/invoices/1')
    })

    // ทดสอบ: ตัดสต็อกเมื่อเปลี่ยนสถานะเป็น Paid
    // Test: Deducts stock when status is changed to Paid
    it('deducts stock when status is changed to Paid', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      const updateMock = vi.fn().mockReturnThis()
      const eqMock = vi.fn().mockResolvedValue({ error: null })

      mockSupabase.from = vi.fn()
        .mockReturnValueOnce({
          update: updateMock,
          eq: eqMock,
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { customer_id: 1 },
            error: null,
          }),
        }) as any

      mockSupabase.rpc.mockResolvedValue({ error: null })

      const result = await updateInvoiceStatus(1, 'Paid')

      expect(mockSupabase.rpc).toHaveBeenCalledWith('deduct_stock_from_invoice', {
        p_invoice_id: 1,
      })
      expect(result).toEqual({ message: 'Success' })
      expect(revalidatePath).toHaveBeenCalledWith('/products')
    })

    // ทดสอบ: จัดการ error จากการตัดสต็อก
    // Test: Handles stock deduction errors
    it('handles stock deduction errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      const updateMock = vi.fn().mockReturnThis()
      const eqMock = vi.fn().mockResolvedValue({ error: null })

      mockSupabase.from = vi.fn(() => ({
        update: updateMock,
        eq: eqMock,
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })) as any

      mockSupabase.rpc.mockResolvedValue({
        error: { message: 'Insufficient stock' },
      })

      const result = await updateInvoiceStatus(1, 'Paid')

      expect(result).toEqual({
        message: 'Status updated, but failed to deduct stock.',
      })
    })
  })

  // ทดสอบการแก้ไขใบแจ้งหนี้
  // Test updating invoice details
  describe('updateInvoice', () => {
    // ทดสอบ: ต้อง redirect ไปหน้า login ถ้าผู้ใช้ยังไม่ได้ล็อกอิน
    // Test: Should redirect to login if user is not authenticated
    it('redirects to login if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const formData = new FormData()
      await updateInvoice(1, formData)

      expect(redirect).toHaveBeenCalledWith('/login')
    })

    // ทดสอบ: แก้ไขรายละเอียดใบแจ้งหนี้สำเร็จ
    // Test: Successfully updates invoice details
    it('successfully updates invoice details', async () => {
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

      const items = [
        { description: 'Updated Product', quantity: 20, unitPrice: 150 },
      ]

      const formData = new FormData()
      formData.append('customerId', '2')
      formData.append('responsiblePersonId', '3')
      formData.append('invoiceNumber', 'INVNo25002PW')
      formData.append('issueDate', '2025-02-01')
      formData.append('dueDate', '2025-02-28')
      formData.append('priceTier', 'wholesale')
      formData.append('items', JSON.stringify(items))

      await updateInvoice(1, formData)

      expect(mockSupabase.from).toHaveBeenCalledWith('invoices')
      expect(updateMock).toHaveBeenCalled()
      expect(eqMock).toHaveBeenCalledWith('id', 1)
      expect(revalidatePath).toHaveBeenCalledWith('/invoices')
    })

    // ทดสอบ: จัดการข้อมูล JSON ที่ไม่ถูกต้อง
    // Test: Handles invalid JSON items data
    it('handles invalid JSON items data', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      const formData = new FormData()
      formData.append('items', 'invalid-json')

      await updateInvoice(1, formData)

      expect(redirect).toHaveBeenCalledWith(
        '/invoices/1/edit?message=Error: Invalid items data.'
      )
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
      formData.append('items', JSON.stringify([]))

      await updateInvoice(1, formData)

      expect(redirect).toHaveBeenCalledWith(
        '/invoices/1/edit?message=Error: Could not update invoice.'
      )
    })
  })
})
