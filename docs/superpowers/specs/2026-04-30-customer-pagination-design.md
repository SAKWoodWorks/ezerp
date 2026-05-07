# Customer Page Pagination Design

**Date:** 2026-04-30  
**Status:** Approved  
**Implementation:** Server-side pagination with shadcn/ui components

## Overview

Add pagination to the customer page to improve performance and usability as the customer database grows. Currently, all customers are loaded at once, which will become a performance bottleneck with large datasets.

## Requirements

- **Page size options**: 25, 50, 100, 200 customers per page
- **Default page size**: 50 customers
- **Pagination location**: Bottom of table only
- **URL-based navigation**: Support browser back/forward, bookmarkable URLs
- **Performance**: True server-side pagination using Supabase range queries
- **UI Framework**: shadcn/ui components
- **Responsive**: Mobile-friendly pagination controls
- **Multilingual**: Support existing Thai/English/Russian translations

## Architecture

### Server-Side Pagination
- Modify `page.tsx` to accept URL search parameters (`page`, `limit`)
- Use Supabase `.range()` method for efficient data fetching
- Separate query for total count when needed
- URL structure: `/customers?page=2&limit=50`

### Data Flow
1. User interacts with pagination controls
2. Client updates URL using `useRouter().push()`
3. Server component receives new search params
4. Server fetches paginated data slice from Supabase
5. Client component renders new data with updated pagination state

### Supabase Queries
```typescript
// Paginated data query
const { data: customers } = await supabase
  .from("customers")
  .select("*")
  .range(start, end)
  .order("created_at", { ascending: false })

// Total count query (when needed)
const { count } = await supabase
  .from("customers")
  .select("*", { count: 'exact', head: true })
```

## Component Structure

### Modified Files
- `src/app/customers/page.tsx` - Enhanced with pagination logic
- `src/app/customers/CustomerClientPage.tsx` - Receives pagination props
- `src/app/customers/components/PaginationControls.tsx` - New component

### Component Props
```typescript
// CustomerClientPage enhanced props
interface Props {
  initialCustomers: Customer[]
  pagination: {
    currentPage: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
}

// PaginationControls props
interface PaginationProps {
  currentPage: number
  totalPages: number
  pageSize: number
  totalCount: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}
```

## URL State Management

### Search Parameters
- `page`: Current page number (default: 1, minimum: 1)
- `limit`: Items per page (default: 50, valid: 25,50,100,200)

### Parameter Validation
- Invalid page numbers default to page 1
- Invalid limit values default to 50
- Page numbers exceeding total pages redirect to last valid page
- Negative or zero page numbers default to page 1

### Navigation Behavior
- Use `URLSearchParams` to preserve existing query parameters
- Reset to page 1 when page size changes
- Automatic scroll to top on page navigation
- Browser back/forward navigation works naturally

### URL Examples
- `/customers` → page 1, limit 50 (defaults)
- `/customers?page=3` → page 3, limit 50
- `/customers?limit=25` → page 1, limit 25
- `/customers?page=2&limit=100` → page 2, limit 100

## UI Design

### Pagination Bar Layout
```
[Showing 1-50 of 234 customers]     [< Previous] [1] [2] [3] ... [Next >]     [Show: 50 ▼]
```

### shadcn/ui Components
- **Page buttons**: `Button` component
  - Active page: `variant="default"`
  - Inactive pages: `variant="outline"`
- **Previous/Next**: `Button` component with `variant="ghost"`
  - Icons: `ChevronLeft`, `ChevronRight` from Lucide
- **Page size selector**: `Select` component
  - Trigger text: "Show: {pageSize}"
  - Options: 25, 50, 100, 200
- **Container**: Flexbox with `justify-between` alignment

### Page Number Display Logic
- Always show: First page, last page, current page
- Show current ±2 pages when space allows
- Use ellipsis ("...") for gaps in sequence
- Example: `[1] ... [4] [5] [6] ... [12]` when on page 5 of 12

### Responsive Behavior
- **Mobile (< 768px)**: Hide individual page numbers, keep Previous/Next + page size
- **Tablet+ (≥ 768px)**: Show full pagination with page numbers
- **Desktop**: Full pagination with expanded spacing

### Loading States
- Disable all pagination controls during navigation
- Show loading spinner or skeleton in pagination area
- Preserve user's last interaction state
- Graceful degradation if JavaScript disabled

## Translation Support

### Translation Keys (add to existing namespaces)
```json
{
  "CustomersPage": {
    "pagination": {
      "showing": "Showing {start}-{end} of {total} customers",
      "previous": "Previous",
      "next": "Next", 
      "show": "Show",
      "page": "Page {number}",
      "goToPage": "Go to page {number}"
    }
  }
}
```

### Multilingual Files to Update
- `messages/th.json` (Thai - primary)
- `messages/en.json` (English)
- `messages/ru.json` (Russian)

## Error Handling

### Error Scenarios
1. **Database connection failure**: Show error message with retry button
2. **Invalid URL parameters**: Silently redirect to valid defaults
3. **Page out of bounds**: Redirect to last available page
4. **Network timeout**: Show loading state, then error with retry option
5. **Zero results**: Show empty state message

### Error UI Patterns
- Follow existing error handling patterns in codebase
- Use error boundaries around pagination components
- Toast notifications for transient errors
- Graceful fallback to cached data when possible

### Error Recovery
- Retry mechanism for failed pagination requests
- Fallback to previous page if current page fails
- Preserve user's page size preference across errors

## Performance Considerations

### Database Optimization
- Add composite index on `(created_at, id)` for efficient pagination
- Use `count: 'exact'` sparingly - cache total count when possible
- Consider separate count query only when displaying total

### Query Efficiency
```sql
-- Efficient pagination query
SELECT * FROM customers 
ORDER BY created_at DESC, id DESC 
LIMIT 50 OFFSET 100;

-- Add index for performance
CREATE INDEX idx_customers_pagination ON customers(created_at DESC, id DESC);
```

### Client Performance
- Debounce rapid page size changes (300ms delay)
- Preload next page data in background (future enhancement)
- Virtualization for very large page sizes (future consideration)

### Caching Strategy
- Server-side: Cache total count for 5 minutes
- Client-side: Cache page navigation for browser back/forward
- Consider Redis for total count caching in production

## Testing Strategy

### Unit Tests
- Pagination calculation functions
- URL parameter parsing and validation
- Edge cases (empty results, single page, boundary conditions)
- Component rendering with different pagination states

### Integration Tests
- Database pagination queries with various page sizes
- URL navigation with search parameters
- Error handling with database failures
- Browser back/forward navigation

### E2E Tests
- Complete pagination flow navigation
- Page size changes with URL updates
- Mobile responsive behavior
- Performance with large datasets (simulate 10,000+ customers)

### Test Data Requirements
- Small dataset (< 25 customers): Single page testing
- Medium dataset (100+ customers): Multi-page testing  
- Large dataset (1000+ customers): Performance testing

## Implementation Notes

### Backwards Compatibility
- Existing `/customers` URLs continue to work (default pagination)
- All existing functionality preserved (add customer, import, etc.)
- No breaking changes to existing components
- Search and filtering remain compatible (future features)

### Future Enhancements
- Search/filter integration with pagination
- Infinite scroll option
- Export paginated results
- Sort column integration with pagination state
- Advanced pagination (jump to page input)

### Database Migration
```sql
-- Add index for efficient pagination (if not exists)
CREATE INDEX IF NOT EXISTS idx_customers_created_at 
ON customers(created_at DESC);
```

### Component File Structure
```
src/app/customers/
├── page.tsx (modified)
├── CustomerClientPage.tsx (modified) 
└── components/
    └── PaginationControls.tsx (new)
```

## Success Criteria

1. **Performance**: Page loads in <500ms with 50 customers, <1s with 200
2. **Usability**: Intuitive navigation, clear current page indication
3. **Responsive**: Works seamlessly on mobile and desktop
4. **SEO**: Proper URLs for each page, bookmarkable
5. **Accessibility**: Keyboard navigation, screen reader support
6. **Multilingual**: Proper translations in all supported languages
7. **Error handling**: Graceful degradation, helpful error messages

## Technical Debt Considerations

This implementation introduces URL state management patterns that should be consistent across other paginated pages in the application. Consider creating shared pagination utilities for future use in products, invoices, and other list pages.