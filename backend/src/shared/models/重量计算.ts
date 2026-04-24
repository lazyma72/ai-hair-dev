import type { 制品规格书 } from "../db/Db沐茵丝假发成品稿"
import type { 上下分标记 } from "./上下分计算尺数"

type DML比值 = {
  D: number
  M?: number
  L?: number
}

export function get档位行系数(rowIndex: number, totalRows: number): number {
  if (totalRows <= 1) return 1
  if (totalRows === 2) return rowIndex === 0 ? 0.4 : 0.6
  return rowIndex < 2 ? 0.3 : 0.4
}

export function calc基础重量(裁断: number, 密度: number, 尺数: number): number {
  return (裁断 * 密度 * 尺数 * 2.54) / 100 / 2
}

export function calc分档基础重量(
  裁断: number,
  密度: number,
  尺数: number,
  rowIndex: number,
  totalRows: number
): number {
  return calc基础重量(裁断, 密度, 尺数) * get档位行系数(rowIndex, totalRows)
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
          D: calc分档基础重量(item.裁断, row.双针.密度, row.双针.尺数.D, rowIndex, totalRows),
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
          D: calc分档基础重量(item.裁断, 密度, 毛长, rowIndex, totalRows),
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
        const base = calc分档基础重量(
          item.裁断,
          row.双针.密度,
          row.双针.尺数.D,
          rowIndex,
          totalRows
        )
        return {
          ...item,
          重量g: {
            D: totalRatio > 0 ? (base * ratio.D) / totalRatio : 0,
            M: ratioInput.M != null && totalRatio > 0 ? (base * ratio.M) / totalRatio : undefined,
            L: ratioInput.L != null && totalRatio > 0 ? (base * ratio.L) / totalRatio : undefined,
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
        const base = calc分档基础重量(item.裁断, 密度, 毛长, rowIndex, totalRows)
        return {
          ...item,
          重量g: {
            D: totalRatio > 0 ? (base * ratio.D) / totalRatio : 0,
            M: ratioInput.M != null && totalRatio > 0 ? (base * ratio.M) / totalRatio : undefined,
            L: ratioInput.L != null && totalRatio > 0 ? (base * ratio.L) / totalRatio : undefined,
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
        const dWeight = calc分档基础重量(
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
            D: dWeight,
            M: splitFlags.hasM
              ? calc分档基础重量(item.裁断, row.双针.密度, m尺数, rowIndex, totalRows)
              : undefined,
            L: splitFlags.hasL
              ? calc分档基础重量(item.裁断, row.双针.密度, l尺数, rowIndex, totalRows)
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
        const base = calc分档基础重量(item.裁断, 密度, 毛长, rowIndex, totalRows)
        return {
          ...item,
          重量g: {
            D: base,
            M: splitFlags.hasM ? base : undefined,
            L: splitFlags.hasL ? base : undefined,
          },
        }
      }),
    }
  })
}
