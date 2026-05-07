// ไฟล์ทดสอบสำหรับ Button Component
// Test file for Button Component
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './button'

describe('Button', () => {
  // ทดสอบการแสดงปุ่มพร้อมข้อความ
  // Test rendering button with text
  it('renders button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  // ทดสอบการจัดการเหตุการณ์คลิก
  // Test handling click events
  it('handles click events', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(<Button onClick={handleClick}>Click me</Button>)

    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  // ทดสอบการใส่ variant classes (รูปแบบปุ่มต่างๆ เช่น ลบ, บันทึก, ยกเลิก)
  // Test applying variant classes correctly (different button styles)
  it('applies variant classes correctly', () => {
    const { rerender } = render(<Button variant="destructive">Delete</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-destructive')

    rerender(<Button variant="success">Save</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-green-600')

    rerender(<Button variant="outline">Cancel</Button>)
    expect(screen.getByRole('button')).toHaveClass('border')
  })

  // ทดสอบการใส่ size classes (ขนาดปุ่มต่างๆ เช่น เล็ก, ใหญ่, ไอคอน)
  // Test applying size classes correctly (different button sizes)
  it('applies size classes correctly', () => {
    const { rerender } = render(<Button size="sm">Small</Button>)
    expect(screen.getByRole('button')).toHaveClass('h-9')

    rerender(<Button size="lg">Large</Button>)
    expect(screen.getByRole('button')).toHaveClass('h-11')

    rerender(<Button size="icon">Icon</Button>)
    expect(screen.getByRole('button')).toHaveClass('h-10', 'w-10')
  })

  // ทดสอบการปิดการใช้งานปุ่มเมื่อ disabled prop เป็น true
  // Test disabled state when disabled prop is true
  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByRole('button')).toHaveClass('disabled:opacity-50')
  })

  // ทดสอบการใส่ custom className
  // Test applying custom className
  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>)
    expect(screen.getByRole('button')).toHaveClass('custom-class')
  })

  // ทดสอบการแสดงเป็น child component เมื่อ asChild เป็น true (เช่น แปลงเป็นลิงก์)
  // Test rendering as child component when asChild is true (e.g., converting to link)
  it('renders as child component when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    )
    const link = screen.getByRole('link')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/test')
  })
})
