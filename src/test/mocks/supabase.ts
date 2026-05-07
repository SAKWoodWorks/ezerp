import { vi } from 'vitest'

/**
 * Mock Supabase Client for testing
 */
export const createMockSupabaseClient = () => {
  const mockSelect = vi.fn().mockReturnThis()
  const mockInsert = vi.fn().mockReturnThis()
  const mockUpdate = vi.fn().mockReturnThis()
  const mockDelete = vi.fn().mockReturnThis()
  const mockEq = vi.fn().mockReturnThis()
  const mockNeq = vi.fn().mockReturnThis()
  const mockGt = vi.fn().mockReturnThis()
  const mockGte = vi.fn().mockReturnThis()
  const mockLt = vi.fn().mockReturnThis()
  const mockLte = vi.fn().mockReturnThis()
  const mockLike = vi.fn().mockReturnThis()
  const mockIlike = vi.fn().mockReturnThis()
  const mockIn = vi.fn().mockReturnThis()
  const mockOrder = vi.fn().mockReturnThis()
  const mockLimit = vi.fn().mockReturnThis()
  const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null })
  const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
  const mockRange = vi.fn().mockReturnThis()

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: 'test-user-id' } } },
        error: null
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' }, session: {} },
        error: null
      }),
    },
    from: vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      neq: mockNeq,
      gt: mockGt,
      gte: mockGte,
      lt: mockLt,
      lte: mockLte,
      like: mockLike,
      ilike: mockIlike,
      in: mockIn,
      order: mockOrder,
      limit: mockLimit,
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
      range: mockRange,
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
        remove: vi.fn().mockResolvedValue({ data: {}, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/test.jpg' }
        }),
      })),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  }
}

/**
 * Mock server-side Supabase client
 */
export const mockCreateClient = vi.fn(() => createMockSupabaseClient())

/**
 * Helper to mock successful data responses
 */
export const mockSupabaseResponse = <T>(data: T) => ({
  data,
  error: null,
})

/**
 * Helper to mock error responses
 */
export const mockSupabaseError = (message: string) => ({
  data: null,
  error: { message, code: 'TEST_ERROR' },
})
