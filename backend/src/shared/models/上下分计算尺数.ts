import type { 制品规格书 } from "../db/Db沐茵丝假发成品稿"
import { 高针图系统预置区域列表, type DML值, type 高针图 } from "./高针图"

export type 上下分标记 = {
  hasM: boolean
  hasL: boolean
}

function normalizeLevelName(name: string): string {
  return String(name ?? "")
    .trim()
    .replace(/档$/u, "")
    .trim()
}

function clampRatio(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(num)) return 0
  const normalized = Math.abs(num) > 1 ? num / 100 : num
  return Math.max(0, Math.min(1, normalized))
}

function isValidDmlValue(value: unknown): value is DML值 {
  return value === "D" || value === "M" || value === "L"
}

function normalizePattern(raw: unknown): DML值[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map(v =>
      String(v ?? "")
        .trim()
        .toUpperCase()
    )
    .filter((v): v is DML值 => v === "D" || v === "M" || v === "L")
}

function uniqueById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>()
  const out: T[] = []
  items.forEach(item => {
    const id = String(item.id ?? "").trim()
    if (!id || seen.has(id)) return
    seen.add(id)
    out.push(item)
  })
  return out
}

function buildRegionOrderHint(graph: 高针图): string[] {
  const preset = 高针图系统预置区域列表.map(d => d.name)
  const existed = uniqueById(
    graph.车线.map(c => ({ id: String(c.区域 ?? "").trim() })).filter(d => d.id)
  ).map(d => d.id)

  const presetSet = new Set(preset)
  const extra = existed.filter(name => !presetSet.has(name)).sort()
  return [...preset, ...extra]
}

function selectByPercent<T extends { 编号: number }>(
  items: T[],
  start: unknown,
  end: unknown
): T[] {
  if (items.length === 0) return []
  const from = Math.min(clampRatio(start), clampRatio(end))
  const to = Math.max(clampRatio(start), clampRatio(end))
  const numbers = items.map(item => item.编号).filter(value => Number.isFinite(value))
  if (numbers.length === 0) return []
  const minNumber = Math.min(...numbers)
  const maxNumber = Math.max(...numbers)
  if (maxNumber <= minNumber) return items
  const startNumber = minNumber + (maxNumber - minNumber) * from
  const endNumber = minNumber + (maxNumber - minNumber) * to
  return items.filter(item => item.编号 >= startNumber && item.编号 <= endNumber)
}

function orderCarlinesByRegionAndNumber(graph: 高针图): 高针图["车线"] {
  const regionOrder = buildRegionOrderHint(graph)
  const rank = new Map<string, number>(regionOrder.map((name, i) => [name, i]))
  return [...graph.车线].sort((a, b) => {
    const ra = rank.get(a.区域) ?? 9999
    const rb = rank.get(b.区域) ?? 9999
    if (ra !== rb) return ra - rb
    return a.编号 - b.编号
  })
}

function orderCarlinesInRegion(graph: 高针图, region: string): 高针图["车线"] {
  return graph.车线.filter(c => c.区域 === region).sort((a, b) => a.编号 - b.编号)
}

function compileDmlAssignments(graph: 高针图): Map<string, DML值> {
  const result = new Map<string, DML值>()
  const orderedByRegion = orderCarlinesByRegionAndNumber(graph)
  const applyPattern = (items: 高针图["车线"], pattern: DML值[]) => {
    items.forEach((c, i) => result.set(c.id, pattern[i % pattern.length]))
  }

  ;(graph.自动修改器 ?? []).forEach(mod => {
    if (!mod || mod.启用 === false) return
    const pattern = normalizePattern(mod.规律)
    if (pattern.length === 0) return

    if (mod.type === "按区域自动标注DML") {
      const selected: 高针图["车线"] = []
      ;(mod.范围 ?? []).forEach(seg => {
        const region = String(seg.区域 ?? "").trim()
        if (!region) return
        const regionItems = orderCarlinesInRegion(graph, region)
        selected.push(...selectByPercent(regionItems, seg.开始, seg.结束))
      })
      applyPattern(selected, pattern)
      return
    }

    if (mod.type === "按档位自动标注DML") {
      const selected: 高针图["车线"] = []
      ;(mod.范围 ?? []).forEach(seg => {
        const gear = normalizeLevelName(String(seg.档位 ?? ""))
        if (!gear) return
        const gearItems = orderedByRegion.filter(c => normalizeLevelName(c.档位) === gear)
        selected.push(...selectByPercent(gearItems, seg.开始, seg.结束))
      })
      applyPattern(selected, pattern)
    }
  })

  return result
}

export function 提取高针图上下分标记(graph: 高针图): 上下分标记 {
  const dmlMap = compileDmlAssignments(graph)
  let hasM = false
  let hasL = false
  dmlMap.forEach(value => {
    if (value === "M") hasM = true
    else if (value === "L") hasL = true
  })
  return { hasM, hasL }
}

export function 根据高针图计算上下分档位尺数(
  graph: 高针图,
  slotName: string,
  splitFlags: 上下分标记 = 提取高针图上下分标记(graph)
): { D: number; M?: number; L?: number } {
  const dmlMap = compileDmlAssignments(graph)
  const totals = { D: 0, M: 0, L: 0 }
  const normalizedSlot = normalizeLevelName(slotName)
  graph.车线
    .filter(c => normalizeLevelName(c.档位) === normalizedSlot)
    .forEach(c => {
      const value = dmlMap.get(c.id) ?? (isValidDmlValue(c.DML) ? c.DML : "D")
      const length = (Number.isFinite(c.尺数) ? c.尺数 : 0) * (c.是双数 ? 2 : 1)
      if (value === "M") totals.M += length
      else if (value === "L") totals.L += length
      else totals.D += length
    })

  return {
    D: totals.D,
    ...(splitFlags.hasM ? { M: totals.M } : {}),
    ...(splitFlags.hasL ? { L: totals.L } : {}),
  }
}

export function 按高针图回算机器规格清单上下分尺数(
  rows: 制品规格书["机器规格清单"],
  graph: 高针图,
  splitFlags: 上下分标记 = 提取高针图上下分标记(graph)
): 制品规格书["机器规格清单"] {
  return rows.map(row => ({
    ...row,
    双针: {
      ...row.双针,
      尺数: 根据高针图计算上下分档位尺数(graph, row.档位, splitFlags),
    },
  }))
}
