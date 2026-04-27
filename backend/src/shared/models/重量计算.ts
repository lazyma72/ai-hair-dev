import type { 制品规格书 } from "../db/Db沐茵丝假发成品稿"
import type { 上下分标记 } from "./上下分计算尺数"

type DML比值 = {
  D: number
  M?: number
  L?: number
}

const 输入精度 = 100n
const 重量精度 = 100n
const 比值精度 = 10n
const 行系数精度 = 10n
const 英寸转厘米分子 = 254n
const 英寸转厘米分母 = 100n

function 四舍五入整除(numerator: bigint, denominator: bigint): bigint {
  if (denominator === 0n) return 0n
  return (numerator + denominator / 2n) / denominator
}

function 转缩放整数(value: number, scale: bigint): bigint {
  return BigInt(Math.round(value * Number(scale)))
}

function 重量整数转数字(value: bigint): number {
  return Number(value) / Number(重量精度)
}

function get档位行系数整数(rowIndex: number, totalRows: number): bigint {
  if (totalRows <= 1) return 行系数精度
  if (totalRows === 2) return rowIndex === 0 ? 4n : 6n
  return rowIndex < 2 ? 3n : 4n
}

function calc基础重量整数(裁断: number, 密度: number, 尺数: number): bigint {
  const 裁断整数 = 转缩放整数(裁断, 输入精度)
  const 密度整数 = 转缩放整数(密度, 输入精度)
  const 尺数整数 = 转缩放整数(尺数, 输入精度)
  const numerator =
    裁断整数 * 密度整数 * 尺数整数 * 英寸转厘米分子 * 重量精度
  const denominator =
    输入精度 *
    输入精度 *
    输入精度 *
    英寸转厘米分母 *
    100n *
    2n
  return 四舍五入整除(numerator, denominator)
}

function calc分档基础重量整数(
  裁断: number,
  密度: number,
  尺数: number,
  rowIndex: number,
  totalRows: number
): bigint {
  const 基础重量整数 = calc基础重量整数(裁断, 密度, 尺数)
  return 四舍五入整除(
    基础重量整数 * get档位行系数整数(rowIndex, totalRows),
    行系数精度
  )
}

function 按比值拆分重量(
  总重量整数: bigint,
  ratioInput: DML比值
): { D: bigint; M?: bigint; L?: bigint } {
  const 启用键: Array<keyof Required<DML比值>> = ["D"]
  if (ratioInput.M != null) 启用键.push("M")
  if (ratioInput.L != null) 启用键.push("L")

  const 比值整数: Required<Record<keyof Required<DML比值>, bigint>> = {
    D: 转缩放整数(ratioInput.D, 比值精度),
    M: 转缩放整数(ratioInput.M ?? 0, 比值精度),
    L: 转缩放整数(ratioInput.L ?? 0, 比值精度),
  }
  const 总比值整数 = 启用键.reduce((sum, key) => sum + 比值整数[key], 0n)

  if (总比值整数 <= 0n) {
    return {
      D: 0n,
      M: ratioInput.M != null ? 0n : undefined,
      L: ratioInput.L != null ? 0n : undefined,
    }
  }

  let 已分配 = 0n
  const result: { D: bigint; M?: bigint; L?: bigint } = { D: 0n }

  启用键.forEach((key, index) => {
    const 是否最后一项 = index === 启用键.length - 1
    const 当前值 = 是否最后一项
      ? 总重量整数 - 已分配
      : (总重量整数 * 比值整数[key]) / 总比值整数

    if (key === "D") result.D = 当前值
    if (key === "M") result.M = 当前值
    if (key === "L") result.L = 当前值
    已分配 += 当前值
  })

  return result
}

export function get档位行系数(rowIndex: number, totalRows: number): number {
  return Number(get档位行系数整数(rowIndex, totalRows)) / Number(行系数精度)
}

export function calc基础重量(裁断: number, 密度: number, 尺数: number): number {
  return 重量整数转数字(calc基础重量整数(裁断, 密度, 尺数))
}

export function calc分档基础重量(
  裁断: number,
  密度: number,
  尺数: number,
  rowIndex: number,
  totalRows: number
): number {
  return 重量整数转数字(calc分档基础重量整数(裁断, 密度, 尺数, rowIndex, totalRows))
}

export function recalc机器规格清单D重量(
  rows: 制品规格书["机器规格清单"]
): 制品规格书["机器规格清单"] {
  return rows.map(row => {
    const totalRows = row.裁断与重量.length
    return {
      ...row,
      裁断与重量: row.裁断与重量.map((item, rowIndex) => ({
        ...item,
        重量g: {
          D: 重量整数转数字(
            calc分档基础重量整数(item.裁断, row.双针.密度, row.双针.尺数.D, rowIndex, totalRows)
          ),
        },
      })),
    }
  })
}

export function recalc人工规格清单D重量(
  rows: 制品规格书["人工规格清单"]
): 制品规格书["人工规格清单"] {
  return rows.map(row => {
    const totalRows = row.裁断与重量.length
    const 密度 = row.双针.密度 ?? 0
    const 毛长 = row.双针.毛长
    return {
      ...row,
      裁断与重量: row.裁断与重量.map((item, rowIndex) => ({
        ...item,
        重量g: {
          D: 重量整数转数字(
            calc分档基础重量整数(item.裁断, 密度, 毛长, rowIndex, totalRows)
          ),
        },
      })),
    }
  })
}

function normalizeDML比值(input: DML比值): Required<DML比值> {
  return {
    D: input.D,
    M: input.M ?? 0,
    L: input.L ?? 0,
  }
}

export function recalc机器规格清单按比例DML重量(
  rows: 制品规格书["机器规格清单"],
  ratioInput: DML比值
): 制品规格书["机器规格清单"] {
  const ratio = normalizeDML比值(ratioInput)
  const totalRatio = ratio.D + ratio.M + ratio.L
  return rows.map(row => {
    const totalRows = row.裁断与重量.length
    return {
      ...row,
      DML比值: {
        D: ratio.D,
        M: ratioInput.M,
        L: ratioInput.L,
      },
      裁断与重量: row.裁断与重量.map((item, rowIndex) => {
        const base整数 = calc分档基础重量整数(
          item.裁断,
          row.双针.密度,
          row.双针.尺数.D,
          rowIndex,
          totalRows
        )
        const 拆分重量 = 按比值拆分重量(base整数, ratioInput)
        return {
          ...item,
          重量g: {
            D: totalRatio > 0 ? 重量整数转数字(拆分重量.D) : 0,
            M:
              ratioInput.M != null && totalRatio > 0
                ? 重量整数转数字(拆分重量.M ?? 0n)
                : undefined,
            L:
              ratioInput.L != null && totalRatio > 0
                ? 重量整数转数字(拆分重量.L ?? 0n)
                : undefined,
          },
        }
      }),
    }
  })
}

export function recalc人工规格清单按比例DML重量(
  rows: 制品规格书["人工规格清单"],
  ratioInput: DML比值
): 制品规格书["人工规格清单"] {
  const ratio = normalizeDML比值(ratioInput)
  const totalRatio = ratio.D + ratio.M + ratio.L
  return rows.map(row => {
    const totalRows = row.裁断与重量.length
    const 密度 = row.双针.密度 ?? 0
    const 毛长 = row.双针.毛长
    return {
      ...row,
      裁断与重量: row.裁断与重量.map((item, rowIndex) => {
        const base整数 = calc分档基础重量整数(item.裁断, 密度, 毛长, rowIndex, totalRows)
        const 拆分重量 = 按比值拆分重量(base整数, ratioInput)
        return {
          ...item,
          重量g: {
            D: totalRatio > 0 ? 重量整数转数字(拆分重量.D) : 0,
            M:
              ratioInput.M != null && totalRatio > 0
                ? 重量整数转数字(拆分重量.M ?? 0n)
                : undefined,
            L:
              ratioInput.L != null && totalRatio > 0
                ? 重量整数转数字(拆分重量.L ?? 0n)
                : undefined,
          },
        }
      }),
    }
  })
}

export function recalc机器规格清单上下分重量(
  rows: 制品规格书["机器规格清单"],
  splitFlags: 上下分标记
): 制品规格书["机器规格清单"] {
  return rows.map(row => {
    const totalRows = row.裁断与重量.length
    return {
      ...row,
      裁断与重量: row.裁断与重量.map((item, rowIndex) => {
        const dWeight整数 = calc分档基础重量整数(
          item.裁断,
          row.双针.密度,
          row.双针.尺数.D,
          rowIndex,
          totalRows
        )
        const m尺数 = row.双针.尺数.M ?? row.双针.尺数.D
        const l尺数 = row.双针.尺数.L ?? row.双针.尺数.D
        return {
          ...item,
          重量g: {
            D: 重量整数转数字(dWeight整数),
            M: splitFlags.hasM
              ? 重量整数转数字(
                  calc分档基础重量整数(
                    item.裁断,
                    row.双针.密度,
                    m尺数,
                    rowIndex,
                    totalRows
                  )
                )
              : undefined,
            L: splitFlags.hasL
              ? 重量整数转数字(
                  calc分档基础重量整数(
                    item.裁断,
                    row.双针.密度,
                    l尺数,
                    rowIndex,
                    totalRows
                  )
                )
              : undefined,
          },
        }
      }),
    }
  })
}

export function recalc人工规格清单上下分重量(
  rows: 制品规格书["人工规格清单"],
  splitFlags: 上下分标记
): 制品规格书["人工规格清单"] {
  return rows.map(row => {
    const totalRows = row.裁断与重量.length
    const 密度 = row.双针.密度 ?? 0
    const 毛长 = row.双针.毛长
    return {
      ...row,
      裁断与重量: row.裁断与重量.map((item, rowIndex) => {
        const base整数 = calc分档基础重量整数(item.裁断, 密度, 毛长, rowIndex, totalRows)
        return {
          ...item,
          重量g: {
            D: 重量整数转数字(base整数),
            M: splitFlags.hasM ? 重量整数转数字(base整数) : undefined,
            L: splitFlags.hasL ? 重量整数转数字(base整数) : undefined,
          },
        }
      }),
    }
  })
}
