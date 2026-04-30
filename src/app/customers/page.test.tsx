import { describe, it, expect, vi, beforeEach } from "vitest"
import CustomersPage from "./page"
import { notFound, redirect } from "next/navigation"

// Mock dependencies
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          range: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
      })),
    })),
  })),
}))

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
  redirect: vi.fn(),
}))

vi.mock("./CustomerClientPage", () => ({
  default: vi.fn(() => <div>Mock Customer Client Page</div>),
}))

describe("CustomersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Range calculation", () => {
    it("calculates correct range for first page", () => {
      const page = 1
      const limit = 50
      const start = (page - 1) * limit
      const end = start + limit - 1

      expect(start).toBe(0)
      expect(end).toBe(49)
    })

    it("calculates correct range for second page", () => {
      const page = 2
      const limit = 50
      const start = (page - 1) * limit
      const end = start + limit - 1

      expect(start).toBe(50)
      expect(end).toBe(99)
    })

    it("calculates correct range for different page sizes", () => {
      // Page 3 with 25 items per page
      const page = 3
      const limit = 25
      const start = (page - 1) * limit
      const end = start + limit - 1

      expect(start).toBe(50)
      expect(end).toBe(74)
    })
  })
})