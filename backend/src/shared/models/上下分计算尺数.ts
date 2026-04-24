import type { 制品规格书 } from "../db/Db沐茵丝假发成品稿"
import type { DML值, DML规则命令 } from "./DML规则"
import type { 高针图 } from "./高针图"

export type 上下分标记 = {
  hasM: boolean
  hasL: boolean
}

type 区域线条 = 高针图["底图"]["区域线条"][number]

function normalizeLevelName(name: string): string {
  return String(name ?? "")
    .trim()
    .replace(/档$/u, "")
    .trim()
}

function normalizePattern(raw: string): string {
  return String(raw ?? "")
    .toUpperCase()
    .split("")
    .filter(ch => ch === "D" || ch === "M" || ch === "L")
    .join("")
}

function clampRatio(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(num)) return 0
  return Math.max(0, Math.min(1, num))
}

function isValidDmlValue(value: unknown): value is DML值 {
  return value === "D" || value === "M" || value === "L"
}

function uniqueLineIds(lineIds: string[]): string[] {
  return Array.from(new Set(lineIds.map(lineId => String(lineId ?? "").trim()).filter(Boolean)))
}

function orderLineIdsByReferenceOrder(rawLineIds: string[], referenceLineIds: string[]): string[] {
  const normalized = uniqueLineIds(rawLineIds)
  if (normalized.length === 0) return []

  const selected = new Set(normalized)
  const ordered: string[] = []

  referenceLineIds.forEach(id => {
    const lineId = String(id ?? "").trim()
    if (!lineId || !selected.has(lineId)) return
    ordered.push(lineId)
    selected.delete(lineId)
  })

  normalized.forEach(lineId => {
    if (!selected.has(lineId)) return
    ordered.push(lineId)
    selected.delete(lineId)
  })

  return ordered
}

function getSortedRegionLines(graph: 高针图): 区域线条[] {
  return (graph.底图.区域线条 ?? [])
    .map((line, index) => ({
      ...line,
      lineNodeId: String(line.lineNodeId ?? "").trim(),
      区域名: String(line.区域名 ?? "").trim(),
      sort: Number.isFinite(line.sort) && line.sort > 0 ? Math.floor(line.sort) : index + 1,
      __index: index,
    }))
    .filter(line => line.lineNodeId)
    .sort((a, b) => a.sort - b.sort || a.__index - b.__index)
    .map(({ __index: _omit, ...line }) => line)
}

function getRegionLinesByName(graph: 高针图): Map<string, 区域线条[]> {
  const out = new Map<string, 区域线条[]>()
  getSortedRegionLines(graph).forEach(line => {
    const list = out.get(line.区域名) ?? []
    list.push(line)
    out.set(line.区域名, list)
  })
  return out
}

function getLevelLineIds(graph: 高针图): Map<string, string[]> {
  const globalOrder = getSortedRegionLines(graph).map(line => line.lineNodeId)
  const out = new Map<string, string[]>()

  ;(graph.底图.档位标注 ?? []).forEach(item => {
    const key = normalizeLevelName(item.区域名)
    if (!key) return
    const list = out.get(key) ?? []
    ;(item.lineNodeIds ?? []).forEach(lineId => {
      const normalized = String(lineId ?? "").trim()
      if (normalized) list.push(normalized)
    })
    out.set(key, orderLineIdsByReferenceOrder(list, globalOrder))
  })

  return out
}

function selectLineIdsByRange(lineIds: string[], start: number, end: number): string[] {
  if (lineIds.length === 0) return []
  const from = Math.min(clampRatio(start), clampRatio(end))
  const to = Math.max(clampRatio(start), clampRatio(end))
  return lineIds.filter((_, index) => {
    const bucketEnd = (index + 1) / lineIds.length
    return bucketEnd > from && bucketEnd <= to
  })
}

function collectCommandLineIds(graph: 高针图, command: DML规则命令): string[] {
  const globalOrder = getSortedRegionLines(graph).map(line => line.lineNodeId)

  if (command.lineNodeIds.length > 0) {
    return orderLineIdsByReferenceOrder(command.lineNodeIds, globalOrder)
  }

  if (command.type === "区域百分比") {
    const byRegion = getRegionLinesByName(graph)
    const out: string[] = []
    ;(command.区域百分比 ?? []).forEach(segment => {
      const regionName = String(segment.区域 ?? "").trim()
      const regionLines = byRegion.get(regionName) ?? []
      out.push(
        ...selectLineIdsByRange(
          regionLines.map(line => line.lineNodeId),
          segment.开始位置,
          segment.结束位置
        )
      )
    })
    return orderLineIdsByReferenceOrder(out, globalOrder)
  }

  if (command.type === "按档位标记") {
    const byLevel = getLevelLineIds(graph)
    const out: string[] = []
    ;(command.档位 ?? []).forEach(segment => {
      const levelName = normalizeLevelName(segment.档位名称)
      out.push(
        ...selectLineIdsByRange(byLevel.get(levelName) ?? [], segment.开始位置, segment.结束位置)
      )
    })
    return orderLineIdsByReferenceOrder(out, globalOrder)
  }

  return uniqueLineIds(command.lineNodeIds ?? [])
}

function compile高针图DmlAssignments(graph: 高针图): Map<string, DML值> {
  const assignments = new Map<string, DML值>()

  ;(graph.自定义数据?.DML规则命令列表 ?? []).forEach(command => {
    if (!command) return

    if (command.type === "特殊标记") {
      if (!isValidDmlValue(command.规律)) return
      const specialValue: DML值 = command.规律
      uniqueLineIds(command.lineNodeIds ?? []).forEach(lineId => {
        assignments.set(lineId, specialValue)
      })
      return
    }

    const pattern = normalizePattern(command.规律)
    if (!pattern) return

    collectCommandLineIds(graph, command).forEach((lineId, index) => {
      assignments.set(lineId, pattern[index % pattern.length] as DML值)
    })
  })

  return assignments
}

export function 提取高针图上下分标记(graph: 高针图): 上下分标记 {
  const dmlMap = compile高针图DmlAssignments(graph)
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
  const dmlMap = compile高针图DmlAssignments(graph)
  const lineMap = new Map(getSortedRegionLines(graph).map(line => [line.lineNodeId, line] as const))
  const doubleSet = new Set(
    (graph.自定义数据?.单双标注 ?? [])
      .filter(item => item?.双数)
      .map(item => String(item.lineNodeId ?? "").trim())
      .filter(Boolean)
  )

  const totals = { D: 0, M: 0, L: 0 }
  const used = new Set<string>()

  ;(graph.底图.档位标注 ?? [])
    .filter(item => normalizeLevelName(item.区域名) === normalizeLevelName(slotName))
    .flatMap(item => item.lineNodeIds ?? [])
    .forEach(rawLineId => {
      const lineId = String(rawLineId ?? "").trim()
      if (!lineId || used.has(lineId)) return
      used.add(lineId)

      const line = lineMap.get(lineId)
      const value = dmlMap.get(lineId)
      if (!line || !value) return

      const length = line.lineLength * (doubleSet.has(lineId) ? 2 : 1)
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
