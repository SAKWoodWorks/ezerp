// ไฟล์ทดสอบสำหรับ Badge Component
// Test file for Badge Component
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './badge'

describe('Badge Component', () => {
  // ทดสอบการแสดง badge element
  // Test rendering badge element
  it('renders badge element', () => {
    render(<Badge>New</Badge>)
    const badge = screen.getByText('New')
    expect(badge).toBeInTheDocument()
  })

  // ทดสอบการแสดง badge แบบ default variant
  // Test rendering with default variant
  it('renders with default variant', () => {
    render(<Badge data-testid="badge">Default</Badge>)
    const badge = screen.getByTestId('badge')
    expect(badge).toHaveAttribute('data-slot', 'badge')
  })

  // ทดสอบการแสดง badge แบบ secondary variant (สีรอง)
  // Test rendering with secondary variant
  it('renders with secondary variant', () => {
    render(
      <Badge variant="secondary" data-testid="badge">
        Secondary
      </Badge>
    )
    const badge = screen.getByTestId('badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('Secondary')
  })

  // ทดสอบการแสดง badge แบบ destructive variant (สีแดงสำหรับข้อผิดพลาด)
  // Test rendering with destructive variant (red for errors)
  it('renders with destructive variant', () => {
    render(
      <Badge variant="destructive" data-testid="badge">
        Error
      </Badge>
    )
    const badge = screen.getByTestId('badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('Error')
  })

  // ทดสอบการแสดง badge แบบ outline variant (มีเส้นขอบ)
  // Test rendering with outline variant
  it('renders with outline variant', () => {
    render(
      <Badge variant="outline" data-testid="badge">
        Outline
      </Badge>
    )
    const badge = screen.getByTestId('badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('Outline')
  })

  // ทดสอบการแสดง badge แบบ success variant (สีเขียวสำหรับความสำเร็จ)
  // Test rendering with success variant (green for success)
  it('renders with success variant', () => {
    render(
      <Badge variant="success" data-testid="badge">
        Success
      </Badge>
    )
    const badge = screen.getByTestId('badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('Success')
  })

  // ทดสอบการใส่ custom className
  // Test applying custom className
  it('applies custom className', () => {
    render(
      <Badge className="custom-badge" data-testid="badge">
        Custom
      </Badge>
    )
    const badge = screen.getByTestId('badge')
    expect(badge).toHaveClass('custom-badge')
  })

  // ทดสอบการส่ง props เพิ่มเติม
  // Test forwarding additional props
  it('forwards additional props', () => {
    render(
      <Badge data-testid="badge" aria-label="status badge">
        Status
      </Badge>
    )
    const badge = screen.getByTestId('badge')
    expect(badge).toHaveAttribute('aria-label', 'status badge')
  })

  // ทดสอบการแสดงเป็น child component เมื่อ asChild เป็น true
  // Test rendering as child component when asChild is true
  it('renders as child component when asChild is true', () => {
    render(
      <Badge asChild>
        <a href="/link">Link Badge</a>
      </Badge>
    )
    const link = screen.getByText('Link Badge')
    expect(link.tagName).toBe('A')
    expect(link).toHaveAttribute('href', '/link')
  })

  // ทดสอบการแสดง badges หลายตัวพร้อมกันที่มี variant ต่างกัน
  // Test rendering multiple badges with different variants
  it('renders multiple badges with different variants', () => {
    render(
      <div>
        <Badge variant="default">Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="success">Success</Badge>
      </div>
    )

    expect(screen.getByText('Default')).toBeInTheDocument()
    expect(screen.getByText('Secondary')).toBeInTheDocument()
    expect(screen.getByText('Destructive')).toBeInTheDocument()
    expect(screen.getByText('Outline')).toBeInTheDocument()
    expect(screen.getByText('Success')).toBeInTheDocument()
  })

  // ทดสอบการจัดการ aria-invalid attribute
  // Test handling aria-invalid attribute
  it('handles aria-invalid attribute', () => {
    render(
      <Badge aria-invalid={true} data-testid="badge">
        Invalid
      </Badge>
    )
    const badge = screen.getByTestId('badge')
    expect(badge).toHaveAttribute('aria-invalid', 'true')
  })
})
