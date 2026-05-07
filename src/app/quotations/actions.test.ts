// ไฟล์ทดสอบสำหรับ Actions ของใบเสนอราคา (Quotations)
// Test file for Quotation Actions
// ทดสอบการสร้างใบเสนอราคาและหมายเลขใบเสนอราคา
// Tests creating quotations and generating quotation numbers
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateNextQuotationNumber, addQuotation } from './actions'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// จำลอง (Mock) dependencies ที่จำเป็น
// Mock necessary dependencies
vi.mock('@/lib/supabase/server')
vi.mock('next/navigation')
vi.mock('next/cache')

// ชุดทดสอบสำหรับ Actions ของใบเสนอราคา
// Test suite for Quotation Actions
describe('Quotation Actions', () => {
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
      eq: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  }

  // ก่อนแต่ละ test ให้ล้าง mock ทั้งหมด
  // Clear all mocks before each test
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  // ทดสอบการสร้างหมายเลขใบเสนอราคาถัดไป
  // Test generating next quotation number
  describe('generateNextQuotationNumber', () => {
    // ทดสอบ: คืนค่า 1 เมื่อไม่มีใบเสนอราคาสำหรับปีปัจจุบัน
    // Test: Returns 1 when no quotations exist for current year
    it('returns 1 when no quotations exist for current year', async () => {
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        like: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      })) as any

      const result = await generateNextQuotationNumber()
      expect(result).toBe(1)
    })

    // ทดสอบ: เพิ่มหมายเลขใบเสนอราคาอย่างถูกต้อง
    // Test: Increments quotation number correctly
    it('increments quotation number correctly', async () => {
      const currentYear = new Date().getFullYear().toString().slice(-2)

      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        like: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { quotation_number: `No${currentYear}010PW` },
          error: null,
        }),
      })) as any

      const result = await generateNextQuotationNumber()
      expect(result).toBe(11)
    })
  })

  // ทดสอบการเพิ่มใบเสนอราคาใหม่
  // Test adding new quotations
  describe('addQuotation', () => {
    // ทดสอบ: ต้อง redirect ไปหน้า login ถ้าผู้ใช้ยังไม่ได้ล็อกอิน
    // Test: Should redirect to login if user is not authenticated
    it('redirects to login if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const formData = new FormData()
      await addQuotation('No25001PW', formData)

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

      await addQuotation('No25001PW', formData)

      expect(redirect).toHaveBeenCalledWith(
        '/quotations/new?message=Error: Please select a customer.'
      )
    })

    // ทดสอบ: สร้างใบเสนอราคาสำเร็จ
    // Test: Successfully creates a quotation
    it('successfully creates a quotation', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      const insertMock = vi.fn().mockReturnThis()
      const selectMock = vi.fn().mockReturnThis()
      const singleMock = vi.fn().mockResolvedValue({
        data: { id: 50, customer_id: 1 },
        error: null,
      })

      mockSupabase.from = vi.fn(() => ({
        insert: insertMock,
        select: selectMock,
        single: singleMock,
      })) as any

      const items = [
        { description: 'Wood Panel', quantity: 100, unitPrice: 500 },
      ]

      const formData = new FormData()
      formData.append('customerId', '1')
      formData.append('responsiblePersonId', '2')
      formData.append('priceTier', 'retail')
      formData.append('issueDate', '2025-01-01')
      formData.append('expiryDate', '2025-01-31')
      formData.append('items', JSON.stringify(items))

      await addQuotation('No25001PW', formData)

      expect(mockSupabase.from).toHaveBeenCalledWith('quotations')
      expect(insertMock).toHaveBeenCalled()
      expect(revalidatePath).toHaveBeenCalledWith('/quotations')
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

      await addQuotation('No25001PW', formData)

      expect(redirect).toHaveBeenCalledWith(
        '/quotations/new?message=Error: Invalid items data.'
      )
    })
  })
})
