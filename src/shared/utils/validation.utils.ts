import { isString, isNumber, isObject } from './common.utils'

/**
 * 验证ID格式
 */
export function isValidId(id: unknown): id is string {
  return isString(id) && id.length > 0 && id.length <= 100
}

/**
 * 验证名称格式
 */
export function isValidName(name: unknown, min = 2, max = 50): name is string {
  return isString(name) && name.length >= min && name.length <= max
}

/**
 * 验证描述格式
 */
export function isValidDescription(description: unknown, max = 500): boolean {
  if (description === undefined || description === null) return true
  return isString(description) && description.length <= max
}

/**
 * 验证页码
 */
export function isValidPage(page: unknown): page is number {
  return isNumber(page) && page >= 1 && Number.isInteger(page)
}

/**
 * 验证每页数量
 */
export function isValidPageSize(pageSize: unknown, max = 100): pageSize is number {
  return isNumber(pageSize) && pageSize >= 1 && pageSize <= max && Number.isInteger(pageSize)
}

/**
 * 验证枚举值
 */
export function isValidEnum<T extends string>(
  value: unknown,
  enumValues: readonly T[]
): value is T {
  return enumValues.includes(value as T)
}

/**
 * 验证对象必须包含指定字段
 */
export function hasRequiredFields(
  obj: unknown,
  requiredFields: string[]
): boolean {
  if (!isObject(obj)) return false
  return requiredFields.every(field => field in obj && obj[field] !== undefined)
}
