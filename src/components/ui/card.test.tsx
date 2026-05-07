// ไฟล์ทดสอบสำหรับ Card Components
// Test file for Card Components
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from './card'

describe('Card Components', () => {
  // ทดสอบ Card Component หลัก
  // Test main Card Component
  describe('Card', () => {
    // ทดสอบการแสดง card element
    // Test rendering card element
    it('renders card element', () => {
      render(<Card data-testid="card">Card Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toBeInTheDocument()
      expect(card).toHaveTextContent('Card Content')
    })

    // ทดสอบการใส่ custom className
    // Test applying custom className
    it('applies custom className', () => {
      render(<Card className="custom-card" data-testid="card" />)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('custom-card')
    })

    // ทดสอบว่ามี data-slot attribute
    // Test has data-slot attribute
    it('has data-slot attribute', () => {
      render(<Card data-testid="card" />)
      const card = screen.getByTestId('card')
      expect(card).toHaveAttribute('data-slot', 'card')
    })
  })

  // ทดสอบ CardHeader (ส่วนหัวของการ์ด)
  // Test CardHeader (card header section)
  describe('CardHeader', () => {
    // ทดสอบการแสดง card header
    // Test rendering card header
    it('renders card header', () => {
      render(<CardHeader data-testid="header">Header Content</CardHeader>)
      const header = screen.getByTestId('header')
      expect(header).toBeInTheDocument()
      expect(header).toHaveTextContent('Header Content')
    })

    // ทดสอบว่ามี data-slot attribute
    // Test has data-slot attribute
    it('has data-slot attribute', () => {
      render(<CardHeader data-testid="header" />)
      const header = screen.getByTestId('header')
      expect(header).toHaveAttribute('data-slot', 'card-header')
    })
  })

  // ทดสอบ CardTitle (หัวข้อการ์ด)
  // Test CardTitle (card title)
  describe('CardTitle', () => {
    // ทดสอบการแสดง card title
    // Test rendering card title
    it('renders card title', () => {
      render(<CardTitle data-testid="title">My Title</CardTitle>)
      const title = screen.getByTestId('title')
      expect(title).toBeInTheDocument()
      expect(title).toHaveTextContent('My Title')
    })

    // ทดสอบว่ามี data-slot attribute
    // Test has data-slot attribute
    it('has data-slot attribute', () => {
      render(<CardTitle data-testid="title" />)
      const title = screen.getByTestId('title')
      expect(title).toHaveAttribute('data-slot', 'card-title')
    })
  })

  // ทดสอบ CardDescription (คำอธิบายการ์ด)
  // Test CardDescription (card description)
  describe('CardDescription', () => {
    // ทดสอบการแสดง card description
    // Test rendering card description
    it('renders card description', () => {
      render(
        <CardDescription data-testid="description">
          This is a description
        </CardDescription>
      )
      const description = screen.getByTestId('description')
      expect(description).toBeInTheDocument()
      expect(description).toHaveTextContent('This is a description')
    })

    // ทดสอบว่ามี data-slot attribute
    // Test has data-slot attribute
    it('has data-slot attribute', () => {
      render(<CardDescription data-testid="description" />)
      const description = screen.getByTestId('description')
      expect(description).toHaveAttribute('data-slot', 'card-description')
    })
  })

  // ทดสอบ CardContent (เนื้อหาหลักของการ์ด)
  // Test CardContent (main content of card)
  describe('CardContent', () => {
    // ทดสอบการแสดง card content
    // Test rendering card content
    it('renders card content', () => {
      render(<CardContent data-testid="content">Main Content</CardContent>)
      const content = screen.getByTestId('content')
      expect(content).toBeInTheDocument()
      expect(content).toHaveTextContent('Main Content')
    })

    // ทดสอบว่ามี data-slot attribute
    // Test has data-slot attribute
    it('has data-slot attribute', () => {
      render(<CardContent data-testid="content" />)
      const content = screen.getByTestId('content')
      expect(content).toHaveAttribute('data-slot', 'card-content')
    })
  })

  // ทดสอบ CardFooter (ส่วนท้ายของการ์ด)
  // Test CardFooter (card footer section)
  describe('CardFooter', () => {
    // ทดสอบการแสดง card footer
    // Test rendering card footer
    it('renders card footer', () => {
      render(<CardFooter data-testid="footer">Footer Content</CardFooter>)
      const footer = screen.getByTestId('footer')
      expect(footer).toBeInTheDocument()
      expect(footer).toHaveTextContent('Footer Content')
    })

    // ทดสอบว่ามี data-slot attribute
    // Test has data-slot attribute
    it('has data-slot attribute', () => {
      render(<CardFooter data-testid="footer" />)
      const footer = screen.getByTestId('footer')
      expect(footer).toHaveAttribute('data-slot', 'card-footer')
    })
  })

  // ทดสอบ CardAction (ปุ่มหรือการกระทำในการ์ด)
  // Test CardAction (buttons or actions in card)
  describe('CardAction', () => {
    // ทดสอบการแสดง card action
    // Test rendering card action
    it('renders card action', () => {
      render(<CardAction data-testid="action">Action Button</CardAction>)
      const action = screen.getByTestId('action')
      expect(action).toBeInTheDocument()
      expect(action).toHaveTextContent('Action Button')
    })

    // ทดสอบว่ามี data-slot attribute
    // Test has data-slot attribute
    it('has data-slot attribute', () => {
      render(<CardAction data-testid="action" />)
      const action = screen.getByTestId('action')
      expect(action).toHaveAttribute('data-slot', 'card-action')
    })
  })

  // ทดสอบการประกอบการ์ดที่สมบูรณ์ (มีทุก component)
  // Test full card composition (with all components)
  describe('Full Card Composition', () => {
    // ทดสอบการแสดงการ์ดที่สมบูรณ์พร้อมทุก component
    // Test rendering a complete card with all components
    it('renders a complete card with all components', () => {
      render(
        <Card data-testid="full-card">
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
            <CardDescription>View product information</CardDescription>
            <CardAction>
              <button>Edit</button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p>Product content goes here</p>
          </CardContent>
          <CardFooter>
            <button>Save</button>
          </CardFooter>
        </Card>
      )

      const card = screen.getByTestId('full-card')
      expect(card).toBeInTheDocument()
      expect(screen.getByText('Product Details')).toBeInTheDocument()
      expect(screen.getByText('View product information')).toBeInTheDocument()
      expect(screen.getByText('Product content goes here')).toBeInTheDocument()
      expect(screen.getByText('Edit')).toBeInTheDocument()
      expect(screen.getByText('Save')).toBeInTheDocument()
    })
  })
})
