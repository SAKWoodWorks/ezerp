// ไฟล์ทดสอบสำหรับ Actions ของผู้รับผิดชอบ (Responsible Persons)
// ทดสอบการเพิ่ม แก้ไข และลบข้อมูลผู้รับผิดชอบ
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  addResponsiblePerson,
  updateResponsiblePerson,
  deleteResponsiblePerson,
} from './actions'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// Mock (จำลอง) dependencies ที่จำเป็น
vi.mock('@/lib/supabase/server')
vi.mock('next/navigation')
vi.mock('next/cache')

describe('Responsible Persons Actions', () => {
  // สร้าง Mock Supabase Client สำหรับการทดสอบ
  const mockSupabase = {
    auth: {
      getUser: vi.fn(), // Mock ฟังก์ชันตรวจสอบผู้ใช้
    },
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }), // Mock การเพิ่มข้อมูล
      update: vi.fn().mockReturnThis(), // Mock การอัพเดทข้อมูล
      delete: vi.fn().mockReturnThis(), // Mock การลบข้อมูล
      eq: vi.fn().mockResolvedValue({ error: null }), // Mock การกรองข้อมูล
    })),
  }

  // ก่อนแต่ละ test ให้ล้าง mock ทั้งหมด
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  describe('addResponsiblePerson', () => {
    it('redirects to login if user is not authenticated', async () => {
      // ทดสอบ: ต้อง redirect ไปหน้า login ถ้าผู้ใช้ยังไม่ได้ล็อกอิน
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const formData = new FormData()
      await addResponsiblePerson(formData)

      expect(redirect).toHaveBeenCalledWith('/login')
    })

    it('successfully adds a new responsible person', async () => {
      // ทดสอบ: เพิ่มผู้รับผิดชอบใหม่สำเร็จ
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      const insertMock = vi.fn().mockResolvedValue({ error: null })

      mockSupabase.from = vi.fn(() => ({
        insert: insertMock,
      })) as any

      // เตรียมข้อมูลฟอร์ม
      const formData = new FormData()
      formData.append('name', 'John Doe')
      formData.append('email', 'john@example.com')
      formData.append('phone', '0812345678')

      await addResponsiblePerson(formData)

      // ตรวจสอบว่าเรียกใช้ Supabase ถูกต้อง
      expect(mockSupabase.from).toHaveBeenCalledWith('responsible_persons')
      expect(insertMock).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '0812345678',
      })
      expect(revalidatePath).toHaveBeenCalledWith('/responsible-persons')
      expect(redirect).toHaveBeenCalledWith('/responsible-persons')
    })

    it('handles errors when adding responsible person fails', async () => {
      // ทดสอบ: จัดการ error เมื่อเพิ่มข้อมูลล้มเหลว (เช่น อีเมลซ้ำ)
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      const insertMock = vi.fn().mockResolvedValue({
        error: { message: 'Duplicate email' },
      })

      mockSupabase.from = vi.fn(() => ({
        insert: insertMock,
      })) as any

      const formData = new FormData()
      formData.append('name', 'Jane Doe')
      formData.append('email', 'existing@example.com')
      formData.append('phone', '0898765432')

      await addResponsiblePerson(formData)

      expect(redirect).toHaveBeenCalledWith(
        '/responsible-persons?message=Error'
      )
    })
  })

  describe('updateResponsiblePerson', () => {
    it('redirects to login if user is not authenticated', async () => {
      // ทดสอบ: ต้อง redirect ไปหน้า login ถ้าผู้ใช้ยังไม่ได้ล็อกอิน
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const formData = new FormData()
      await updateResponsiblePerson(1, formData)

      expect(redirect).toHaveBeenCalledWith('/login')
    })

    it('successfully updates a responsible person', async () => {
      // ทดสอบ: แก้ไขข้อมูลผู้รับผิดชอบสำเร็จ
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
      formData.append('name', 'John Updated')
      formData.append('email', 'john.updated@example.com')
      formData.append('phone', '0811111111')

      await updateResponsiblePerson(1, formData)

      expect(mockSupabase.from).toHaveBeenCalledWith('responsible_persons')
      expect(updateMock).toHaveBeenCalledWith({
        name: 'John Updated',
        email: 'john.updated@example.com',
        phone: '0811111111',
      })
      expect(eqMock).toHaveBeenCalledWith('id', 1)
      expect(revalidatePath).toHaveBeenCalledWith('/responsible-persons')
      expect(revalidatePath).toHaveBeenCalledWith('/responsible-persons/1')
      expect(redirect).toHaveBeenCalledWith('/responsible-persons')
    })

    it('handles errors when updating responsible person fails', async () => {
      // ทดสอบ: จัดการ error เมื่ออัพเดทล้มเหลว
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
      formData.append('email', 'test@example.com')
      formData.append('phone', '0800000000')

      await updateResponsiblePerson(1, formData)

      expect(redirect).toHaveBeenCalledWith(
        '/responsible-persons/1?message=Error'
      )
    })

    it('validates all form fields are captured', async () => {
      // ทดสอบ: ตรวจสอบว่าข้อมูลทุกฟิลด์ถูกส่งไปอัพเดทครบถ้วน
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
      formData.append('name', 'Complete Person')
      formData.append('email', 'complete@example.com')
      formData.append('phone', '0899999999')

      await updateResponsiblePerson(5, formData)

      expect(updateMock).toHaveBeenCalledWith({
        name: 'Complete Person',
        email: 'complete@example.com',
        phone: '0899999999',
      })
      expect(eqMock).toHaveBeenCalledWith('id', 5)
    })
  })

  describe('deleteResponsiblePerson', () => {
    it('redirects to login if user is not authenticated', async () => {
      // ทดสอบ: ต้อง redirect ไปหน้า login ถ้าผู้ใช้ยังไม่ได้ล็อกอิน
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      await deleteResponsiblePerson(1)

      expect(redirect).toHaveBeenCalledWith('/login')
    })

    it('successfully deletes a responsible person', async () => {
      // ทดสอบ: ลบผู้รับผิดชอบสำเร็จ
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

      await deleteResponsiblePerson(1)

      expect(mockSupabase.from).toHaveBeenCalledWith('responsible_persons')
      expect(deleteMock).toHaveBeenCalled()
      expect(eqMock).toHaveBeenCalledWith('id', 1)
      expect(revalidatePath).toHaveBeenCalledWith('/responsible-persons')
      expect(redirect).toHaveBeenCalledWith('/responsible-persons')
    })

    it('handles errors when deleting responsible person fails', async () => {
      // ทดสอบ: จัดการ error เมื่อลบล้มเหลว (เช่น มีการใช้งานอยู่ในใบแจ้งหนี้)
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })

      const deleteMock = vi.fn().mockReturnThis()
      const eqMock = vi.fn().mockResolvedValue({
        error: { message: 'Cannot delete: person is assigned to invoices' },
      })

      mockSupabase.from = vi.fn(() => ({
        delete: deleteMock,
        eq: eqMock,
      })) as any

      await deleteResponsiblePerson(1)

      expect(redirect).toHaveBeenCalledWith(
        '/responsible-persons?message=Error'
      )
    })

    it('deletes the correct person by ID', async () => {
      // ทดสอบ: ลบผู้รับผิดชอบที่มี ID ตรงกับที่ระบุ
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

      await deleteResponsiblePerson(42)

      expect(eqMock).toHaveBeenCalledWith('id', 42)
      expect(redirect).toHaveBeenCalledWith('/responsible-persons')
    })
  })
})
