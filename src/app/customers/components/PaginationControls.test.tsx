import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import PaginationControls from "./PaginationControls"

// Mock the next-intl module for this specific test
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, any>) => {
    if (key === 'showing' && values) {
      return `Showing ${values.start}-${values.end} of ${values.total} customers`
    }
    if (key === 'goToPage' && values) {
      return `Go to page ${values.number}`
    }
    return key
  },
  NextIntlClientProvider: ({ children }: any) => children,
}))

const messages = {
  CustomersPage: {
    pagination: {
      showing: "Showing {start}-{end} of {total} customers",
      previous: "Previous",
      next: "Next",
      show: "Show",
      page: "Page {number}",
      goToPage: "Go to page {number}"
    }
  }
}

const renderWithIntl = (component: React.ReactElement) => {
  return render(component)
}

describe("PaginationControls", () => {
  const mockOnPageChange = vi.fn()
  const mockOnPageSizeChange = vi.fn()

  beforeEach(() => {
    mockOnPageChange.mockClear()
    mockOnPageSizeChange.mockClear()
  })

  it("renders pagination info correctly", () => {
    renderWithIntl(
      <PaginationControls
        currentPage={2}
        totalPages={5}
        pageSize={50}
        totalCount={234}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />
    )

    expect(screen.getByText("Showing 51-100 of 234 customers")).toBeInTheDocument()
  })

  it("renders page buttons correctly", () => {
    renderWithIntl(
      <PaginationControls
        currentPage={3}
        totalPages={7}
        pageSize={25}
        totalCount={160}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />
    )

    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.getByText("4")).toBeInTheDocument()
    expect(screen.getByText("5")).toBeInTheDocument()
  })

  it("calls onPageChange when page button clicked", () => {
    renderWithIntl(
      <PaginationControls
        currentPage={2}
        totalPages={5}
        pageSize={50}
        totalCount={234}
        onPageChange={mockOnPageChange}
        onPageSizeChange={mockOnPageSizeChange}
      />
    )

    fireEvent.click(screen.getByText("3"))
    expect(mockOnPageChange).toHaveBeenCalledWith(3)
  })
})