// นำเข้า dependencies สำหรับการทดสอบ
import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'

// ข้อความจำลองสำหรับใช้ในการทดสอบ
// Mock messages for testing
const messages = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
  },
}

// Interface สำหรับกำหนด options ในการ render component
// ขยายจาก RenderOptions แต่ตัดฟิลด์ wrapper ออก และเพิ่ม locale กับ messages
interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  locale?: string // ภาษาที่ต้องการใช้ในการทดสอบ (ค่าเริ่มต้น: 'th')
  messages?: Record<string, any> // ข้อความแปลภาษาที่กำหนดเอง
}

/**
 * ฟังก์ชันสำหรับ render component พร้อม Next-Intl provider
 * ใช้สำหรับทดสอบ component ที่ใช้ระบบแปลภาษา
 *
 * Custom render function with Next-Intl provider
 *
 * @param ui - React component ที่ต้องการ render
 * @param locale - ภาษาที่ต้องการใช้ (ค่าเริ่มต้น: 'th')
 * @param messages - ข้อความแปลภาษา (ค่าเริ่มต้น: messages ที่กำหนดไว้ข้างบน)
 * @param renderOptions - ตัวเลือกอื่นๆ สำหรับการ render
 */
export function renderWithIntl(
  ui: ReactElement,
  {
    locale = 'th',
    messages: customMessages = messages,
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  // สร้าง Wrapper component เพื่อห่อ component ที่ต้องการทดสอบด้วย NextIntlClientProvider
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <NextIntlClientProvider locale={locale} messages={customMessages}>
        {children}
      </NextIntlClientProvider>
    )
  }

  // Render component พร้อม wrapper และ options ที่ระบุ
  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// ส่งออก function และ utilities ทั้งหมดจาก React Testing Library
// เพื่อให้สามารถใช้งานได้จากไฟล์เดียว
// Re-export everything from React Testing Library
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
