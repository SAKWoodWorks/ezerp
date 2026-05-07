// ไฟล์ทดสอบสำหรับ Utility Functions
// Test file for Utility Functions
import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('utils', () => {
  // ทดสอบฟังก์ชัน cn (className merger) - รวม CSS classes
  // Test cn function (className merger)
  describe('cn (className merger)', () => {
    // ทดสอบการรวม className strings
    // Test merging className strings
    it('merges className strings', () => {
      expect(cn('px-4', 'py-2')).toBe('px-4 py-2')
    })

    // ทดสอบการจัดการ conditional classes (เงื่อนไข)
    // Test handling conditional classes
    it('handles conditional classes', () => {
      expect(cn('base', true && 'active', false && 'hidden')).toBe('base active')
    })

    // ทดสอบการรวม Tailwind classes โดยไม่มีความขัดแย้ง (เก็บค่าสุดท้าย)
    // Test merging tailwind classes without conflicts (keeps last value)
    it('merges tailwind classes without conflicts', () => {
      // tailwind-merge ควรเก็บ class ที่ขัดแย้งกันตัวสุดท้าย
      // tailwind-merge should keep the last conflicting class
      expect(cn('px-4', 'px-8')).toBe('px-8')
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
    })

    // ทดสอบการจัดการค่า undefined และ null
    // Test handling undefined and null values
    it('handles undefined and null values', () => {
      expect(cn('base', undefined, null, 'active')).toBe('base active')
    })

    // ทดสอบการจัดการ arrays ของ classes
    // Test handling arrays of classes
    it('handles arrays of classes', () => {
      expect(cn(['px-4', 'py-2'], 'rounded')).toBe('px-4 py-2 rounded')
    })

    // ทดสอบการจัดการ objects ที่มีค่า boolean (true/false)
    // Test handling objects with boolean values
    it('handles objects with boolean values', () => {
      expect(cn({
        'px-4': true,
        'py-2': true,
        'hidden': false,
      })).toBe('px-4 py-2')
    })
  })
})
