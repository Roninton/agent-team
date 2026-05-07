import {
  isValidId,
  isValidName,
  isValidDescription,
  isValidPage,
  isValidPageSize,
  isValidEnum,
  hasRequiredFields,
} from '../utils/validation.utils'

describe('isValidId', () => {
  it('should return true for valid ids', () => {
    expect(isValidId('agent-123')).toBe(true)
    expect(isValidId('a')).toBe(true)
    expect(isValidId('x'.repeat(100))).toBe(true)
  })

  it('should return false for invalid ids', () => {
    expect(isValidId('')).toBe(false)
    expect(isValidId(123 as any)).toBe(false)
    expect(isValidId(null as any)).toBe(false)
    expect(isValidId(undefined as any)).toBe(false)
  })
})

describe('isValidName', () => {
  it('should return true for names within length range', () => {
    expect(isValidName('test')).toBe(true)
    expect(isValidName('ab')).toBe(true)
    expect(isValidName('a'.repeat(50))).toBe(true)
  })

  it('should return false for names outside length range', () => {
    expect(isValidName('a')).toBe(false)
    expect(isValidName('a'.repeat(51))).toBe(false)
    expect(isValidName('')).toBe(false)
    expect(isValidName(123 as any)).toBe(false)
  })
})

describe('isValidDescription', () => {
  it('should return true for undefined or null', () => {
    expect(isValidDescription(undefined)).toBe(true)
    expect(isValidDescription(null)).toBe(true)
  })

  it('should return true for descriptions within max length', () => {
    expect(isValidDescription('valid description')).toBe(true)
    expect(isValidDescription('a'.repeat(500))).toBe(true)
  })

  it('should return false for too long descriptions', () => {
    expect(isValidDescription('a'.repeat(501))).toBe(false)
  })
})

describe('isValidPage', () => {
  it('should return true for positive integers', () => {
    expect(isValidPage(1)).toBe(true)
    expect(isValidPage(100)).toBe(true)
    expect(isValidPage(9999)).toBe(true)
  })

  it('should return false for non-positive integers or non-numbers', () => {
    expect(isValidPage(0)).toBe(false)
    expect(isValidPage(-1)).toBe(false)
    expect(isValidPage(1.5)).toBe(false)
    expect(isValidPage('1' as any)).toBe(false)
    expect(isValidPage(null as any)).toBe(false)
  })
})

describe('isValidPageSize', () => {
  it('should return true for valid page sizes', () => {
    expect(isValidPageSize(1)).toBe(true)
    expect(isValidPageSize(50)).toBe(true)
    expect(isValidPageSize(100)).toBe(true)
  })

  it('should return false for invalid page sizes', () => {
    expect(isValidPageSize(0)).toBe(false)
    expect(isValidPageSize(101)).toBe(false)
    expect(isValidPageSize(-1)).toBe(false)
    expect(isValidPageSize(1.5)).toBe(false)
  })
})

describe('isValidEnum', () => {
  const validValues = ['active', 'inactive', 'paused'] as const

  it('should return true for valid enum values', () => {
    expect(isValidEnum('active', validValues)).toBe(true)
    expect(isValidEnum('paused', validValues)).toBe(true)
  })

  it('should return false for invalid enum values', () => {
    expect(isValidEnum('unknown', validValues)).toBe(false)
    expect(isValidEnum('', validValues)).toBe(false)
  })
})

describe('hasRequiredFields', () => {
  it('should return true when all required fields exist', () => {
    const obj = { id: '1', name: 'test', status: 'active' }
    expect(hasRequiredFields(obj, ['id', 'name'])).toBe(true)
    expect(hasRequiredFields(obj, ['id', 'name', 'status'])).toBe(true)
  })

  it('should return false when required fields are missing', () => {
    const obj = { id: '1' }
    expect(hasRequiredFields(obj, ['id', 'name'])).toBe(false)
  })

  it('should return false for non-objects', () => {
    expect(hasRequiredFields(null, ['id'])).toBe(false)
    expect(hasRequiredFields(undefined, ['id'])).toBe(false)
    expect(hasRequiredFields('not-an-object' as any, ['id'])).toBe(false)
  })
})
