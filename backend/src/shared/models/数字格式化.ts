import { 数字转分数字符串 } from "./分数转换"

function 去尾随零(value: string): string {
  return value.replace(/(\.\d*?[1-9])0+$/u, "$1").replace(/\.0+$/u, "")
}

export function 格式化定位小数(value: number, digits = 2): string {
  return value.toFixed(digits)
}

export function 格式化可选定位小数(
  value: number | undefined,
  digits = 2,
  emptyText = "—"
): string {
  if (value == null) return emptyText
  return 格式化定位小数(value, digits)
}

export function 格式化最多一位小数(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return 去尾随零(rounded.toFixed(1))
}

export function 格式化可选最多一位小数(
  value: number | undefined,
  emptyText = "—"
): string {
  if (value == null) return emptyText
  return 格式化最多一位小数(value)
}

export function 格式化四分之一分数(
  value: number | undefined,
  emptyText = "—"
): string {
  if (value == null) return emptyText
  return 数字转分数字符串(value)
}

export function 格式化厘米文本(value: number, digits = 1): string {
  const normalized = Number.isFinite(value) ? value : 0
  return `${格式化定位小数(normalized, digits)}CM`
}
