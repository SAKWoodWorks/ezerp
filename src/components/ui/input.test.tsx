// ไฟล์ทดสอบสำหรับ Input Component (ช่องกรอกข้อมูล)
// ทดสอบการทำงานของช่อง input แบบต่างๆ เช่น text, email, password, number
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from './input'

describe('Input Component', () => {
  it('renders an input element', () => {
    // ทดสอบ: แสดงผล input element
    render(<Input />)
    const input = screen.getByRole('textbox')
    expect(input).toBeInTheDocument()
  })

  it('accepts and displays text input', async () => {
    // ทดสอบ: รับและแสดงผลข้อความที่ผู้ใช้พิมพ์
    const user = userEvent.setup()
    render(<Input placeholder="Enter text" />)
    const input = screen.getByPlaceholderText('Enter text')

    await user.type(input, 'Hello World')
    expect(input).toHaveValue('Hello World')
  })

  it('applies custom className', () => {
    // ทดสอบ: ใช้ custom CSS class ได้
    render(<Input className="custom-class" data-testid="input" />)
    const input = screen.getByTestId('input')
    expect(input).toHaveClass('custom-class')
  })

  it('supports different input types', () => {
    // ทดสอบ: รองรับ input types ต่างๆ เช่น email, password, number
    const { rerender } = render(<Input type="email" data-testid="input" />)
    let input = screen.getByTestId('input')
    expect(input).toHaveAttribute('type', 'email')

    rerender(<Input type="password" data-testid="input" />)
    input = screen.getByTestId('input')
    expect(input).toHaveAttribute('type', 'password')

    rerender(<Input type="number" data-testid="input" />)
    input = screen.getByTestId('input')
    expect(input).toHaveAttribute('type', 'number')
  })

  it('can be disabled', () => {
    // ทดสอบ: สามารถปิดการใช้งาน (disabled) ได้
    render(<Input disabled data-testid="input" />)
    const input = screen.getByTestId('input')
    expect(input).toBeDisabled()
  })

  it('supports placeholder text', () => {
    // ทดสอบ: แสดง placeholder text ได้
    render(<Input placeholder="Search..." />)
    const input = screen.getByPlaceholderText('Search...')
    expect(input).toBeInTheDocument()
  })

  it('forwards additional props', () => {
    // ทดสอบ: ส่งต่อ props เพิ่มเติมได้ เช่น name, id
    render(<Input name="username" id="user-input" data-testid="input" />)
    const input = screen.getByTestId('input')
    expect(input).toHaveAttribute('name', 'username')
    expect(input).toHaveAttribute('id', 'user-input')
  })

  it('handles aria-invalid attribute', () => {
    // ทดสอบ: รองรับ aria-invalid สำหรับการแสดงสถานะ error
    render(<Input aria-invalid={true} data-testid="input" />)
    const input = screen.getByTestId('input')
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  it('applies data-slot attribute', () => {
    // ทดสอบ: มี data-slot attribute สำหรับ styling
    render(<Input data-testid="input" />)
    const input = screen.getByTestId('input')
    expect(input).toHaveAttribute('data-slot', 'input')
  })
})
