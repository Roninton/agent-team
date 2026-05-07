import {
  generateId,
  deepClone,
  deepMerge,
  isString,
  isNumber,
  isObject,
  isArray,
  formatTime,
  formatDate,
  sleep,
} from '../utils/common.utils'

describe('generateId', () => {
  it('should generate id with specified prefix', () => {
    const id = generateId('test')
    expect(id).toMatch(/^test-\d+-\w+$/)
  })

  it('should generate unique ids for consecutive calls', () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateId())
    }
    expect(ids.size).toBe(100)
  })

  it('should use default prefix when not specified', () => {
    const id = generateId()
    expect(id).toMatch(/^id-\d+-\w+$/)
  })
})

describe('deepClone', () => {
  it('should clone primitive types correctly', () => {
    expect(deepClone(42)).toBe(42)
    expect(deepClone('hello')).toBe('hello')
    expect(deepClone(true)).toBe(true)
    expect(deepClone(null)).toBeNull()
    expect(deepClone(undefined)).toBeUndefined()
  })

  it('should clone nested objects correctly', () => {
    const original = {
      a: 1,
      b: { c: 2, d: { e: 3 } },
      arr: [1, 2, { three: 3 }],
    }
    const cloned = deepClone(original)
    expect(cloned).toEqual(original)
    expect(cloned.b).not.toBe(original.b)
    expect(cloned.b.d).not.toBe(original.b.d)
    expect(cloned.arr[2]).not.toBe(original.arr[2])
  })

  it('should clone arrays correctly', () => {
    const original = [1, 2, [3, 4]]
    const cloned = deepClone(original)
    expect(cloned).toEqual(original)
    expect(cloned).not.toBe(original)
    expect(cloned[2]).not.toBe(original[2])
  })

  it('should create new reference, not modify original', () => {
    const original = { a: 1 }
    const cloned = deepClone(original)
    cloned.a = 2
    expect(original.a).toBe(1)
  })
})

describe('deepMerge', () => {
  it('should merge basic properties correctly', () => {
    const target = { a: 1, b: 2 }
    const source = { b: 3, c: 4 }
    const result = deepMerge(target, source)
    expect(result).toEqual({ a: 1, b: 3, c: 4 })
  })

  it('should deep merge nested objects', () => {
    const target = { a: { b: 1, c: 2 }, d: 3 }
    const source = { a: { b: 0, c: 99, e: 4 }, f: 5 }
    const result = deepMerge(target, source)
    expect(result).toEqual({
      a: { b: 0, c: 99, e: 4 },
      d: 3,
      f: 5,
    })
  })

  it('should override target properties with source properties', () => {
    const target = { a: 1 }
    const source = { a: 2 }
    const result = deepMerge(target, source)
    expect(result.a).toBe(2)
  })

  it('should not modify original objects', () => {
    const target = { a: 1, b: 0 }
    const source = { b: 2 }
    const result = deepMerge(target, source)
    expect(target).toEqual({ a: 1, b: 0 })
    expect(source).toEqual({ b: 2 })
    expect(result).toEqual({ a: 1, b: 2 })
  })
})

describe('Type guards', () => {
  describe('isString', () => {
    it('should return true for strings', () => {
      expect(isString('hello')).toBe(true)
      expect(isString('')).toBe(true)
      expect(isString('123')).toBe(true)
    })

    it('should return false for non-strings', () => {
      expect(isString(123)).toBe(false)
      expect(isString({})).toBe(false)
      expect(isString([])).toBe(false)
      expect(isString(null)).toBe(false)
      expect(isString(undefined)).toBe(false)
      expect(isString(true)).toBe(false)
    })
  })

  describe('isNumber', () => {
    it('should return true for valid numbers', () => {
      expect(isNumber(42)).toBe(true)
      expect(isNumber(-1)).toBe(true)
      expect(isNumber(0)).toBe(true)
      expect(isNumber(3.14)).toBe(true)
    })

    it('should return false for NaN and non-numbers', () => {
      expect(isNumber(NaN)).toBe(false)
      expect(isNumber('123')).toBe(false)
      expect(isNumber({})).toBe(false)
      expect(isNumber(null)).toBe(false)
      expect(isNumber(undefined)).toBe(false)
    })
  })

  describe('isObject', () => {
    it('should return true for plain objects', () => {
      expect(isObject({})).toBe(true)
      expect(isObject({ a: 1 })).toBe(true)
    })

    it('should return false for non-objects', () => {
      expect(isObject([])).toBe(false)
      expect(isObject(null)).toBe(false)
      expect(isObject('obj')).toBe(false)
      expect(isObject(123)).toBe(false)
      expect(isObject(undefined)).toBe(false)
    })
  })

  describe('isArray', () => {
    it('should return true for arrays', () => {
      expect(isArray([])).toBe(true)
      expect(isArray([1, 2, 3])).toBe(true)
      expect(isArray(new Array())).toBe(true)
    })

    it('should return false for non-arrays', () => {
      expect(isArray({})).toBe(false)
      expect(isArray('array')).toBe(false)
      expect(isArray(123)).toBe(false)
      expect(isArray(null)).toBe(false)
      expect(isArray(undefined)).toBe(false)
    })
  })
})

describe('formatTime', () => {
  it('should return formatted time string', () => {
    const timestamp = Date.now()
    const result = formatTime(timestamp)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('formatDate', () => {
  it('should return formatted date string', () => {
    const timestamp = Date.now()
    const result = formatDate(timestamp)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('sleep', () => {
  it('should resolve after specified time', async () => {
    const start = Date.now()
    await sleep(10)
    const elapsed = Date.now() - start
    expect(elapsed).toBeGreaterThanOrEqual(10)
  })
})
