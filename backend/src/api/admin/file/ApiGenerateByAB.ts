import { ApiCall } from "tsrpc"
import {
  ReqGenerateByAB,
  ResGenerateByAB,
} from "../../../shared/protocols/admin/file/PtlGenerateByAB"
import { Global } from "../../../models/Global"
import {
  假发类型,
  type 染色档位,
  type 沐茵丝假发成品稿,
} from "../../../shared/db/Db沐茵丝假发成品稿"
import {
  recalc人工规格清单D重量,
  recalc人工规格清单上下分重量,
  recalc人工规格清单按比例DML重量,
  recalc机器规格清单D重量,
  recalc机器规格清单上下分重量,
  recalc机器规格清单按比例DML重量,
} from "../../../shared/models/重量计算"
import {
  按高针图回算机器规格清单上下分尺数 as shared按高针图回算机器规格清单上下分尺数,
  提取高针图上下分标记 as shared提取高针图上下分标记,
  type 上下分标记,
} from "../../../shared/models/上下分计算尺数"
import { ObjectId } from "mongodb"
import type { DML值, 高针图 } from "../../../shared/models/高针图"
import { 高针图系统预置区域列表 } from "../../../shared/models/高针图"

type DML比值 = {
  D: number
  M?: number
  L?: number
}

type 调试日志函数 = (阶段: string, data: Record<string, unknown>) => void

function 深拷贝普通对象<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function 清空高针图编辑器JSON中的DML标注和自动化标注(json: string): string {
  if (!String(json ?? "").trim()) return ""

  try {
    const doc = JSON.parse(json) as {
      scene?: {
        nodes?: Record<string, any>
        order?: string[]
      }
      domain?: {
        车线?: any[]
        自动修改器?: any[]
      }
    }

    const dmlNodeIds = new Set(
      Object.entries(doc.scene?.nodes ?? {})
        .filter(([, node]) => node?.business?.type === "标注" && node.business?.字段 === "DML")
        .map(([nodeId]) => nodeId)
    )

    const nextNodes = Object.fromEntries(
      Object.entries(doc.scene?.nodes ?? {})
        .filter(([nodeId]) => !dmlNodeIds.has(nodeId))
        .map(([nodeId, node]) => {
          if (node?.business?.type !== "车线") return [nodeId, node]

          const next标注NodeId = { ...(node.business.标注NodeId ?? {}) }
          delete next标注NodeId.DML

          const nextBusiness = {
            ...node.business,
            标注NodeId: next标注NodeId,
          }
          delete nextBusiness.DML

          return [
            nodeId,
            {
              ...node,
              business: nextBusiness,
            },
          ]
        })
    )

    const next车线 = (doc.domain?.车线 ?? []).map(carline => {
      const next标注NodeId = { ...(carline?.标注NodeId ?? {}) }
      delete next标注NodeId.DML

      const nextCarline = {
        ...carline,
        标注NodeId: next标注NodeId,
      }
      delete nextCarline.DML
      return nextCarline
    })

    return JSON.stringify({
      ...doc,
      scene: doc.scene
        ? {
            ...doc.scene,
            nodes: nextNodes,
            order: (doc.scene.order ?? []).filter(nodeId => !dmlNodeIds.has(nodeId)),
          }
        : doc.scene,
      domain: doc.domain
        ? {
            ...doc.domain,
            车线: next车线,
            自动修改器: [],
          }
        : doc.domain,
    })
  } catch {
    return json
  }
}

function 清空高针图DML标注和自动化标注(
  graph: 沐茵丝假发成品稿["高针指示单"]["高针图"]
): 沐茵丝假发成品稿["高针指示单"]["高针图"] {
  const nextGraph = 深拷贝普通对象(graph)

  return {
    ...nextGraph,
    json: 清空高针图编辑器JSON中的DML标注和自动化标注(nextGraph.json),
    车线: (nextGraph.车线 ?? []).map(carline => {
      const next标注NodeId = { ...(carline.标注NodeId ?? {}) }
      delete next标注NodeId.DML

      const nextCarline = {
        ...carline,
        标注NodeId: next标注NodeId,
      }
      delete nextCarline.DML
      return nextCarline
    }),
    自动修改器: [],
  }
}

function resolve编辑器文本节点中心(node: {
  fabricObject?: {
    left?: unknown
    top?: unknown
    width?: unknown
    fontSize?: unknown
    originX?: unknown
    originY?: unknown
  }
}): { x: number; y: number } {
  const width =
    typeof node.fabricObject?.width === "number" && Number.isFinite(node.fabricObject.width)
      ? node.fabricObject.width
      : 28
  const fontSize =
    typeof node.fabricObject?.fontSize === "number" && Number.isFinite(node.fabricObject.fontSize)
      ? node.fabricObject.fontSize
      : 18
  const height = fontSize * 1.1
  const left =
    typeof node.fabricObject?.left === "number" && Number.isFinite(node.fabricObject.left)
      ? node.fabricObject.left
      : 0
  const top =
    typeof node.fabricObject?.top === "number" && Number.isFinite(node.fabricObject.top)
      ? node.fabricObject.top
      : 0
  const originX = node.fabricObject?.originX
  const originY = node.fabricObject?.originY
  const originFactorX = originX === "center" ? 0.5 : originX === "right" ? 1 : 0
  const originFactorY = originY === "center" ? 0.5 : originY === "bottom" ? 1 : 0

  return {
    x: left + width * (0.5 - originFactorX),
    y: top + height * (0.5 - originFactorY),
  }
}

function 创建DML标注节点(
  nodeId: string,
  carlineId: string,
  dmlValue: DML值,
  position: { x: number; y: number },
  标注样式?: 沐茵丝假发成品稿["高针指示单"]["高针图"]["标注样式"]["DML"]
) {
  const fontSize =
    typeof 标注样式?.字号 === "number" && Number.isFinite(标注样式.字号)
      ? Math.max(4, Math.round(标注样式.字号))
      : 18
  const width = Math.max(28, fontSize * (String(dmlValue).length + 1))
  const height = fontSize * 1.1

  return {
    id: nodeId,
    name: "DML标注",
    locked: true,
    hidden: false,
    zIndex: 0,
    business: {
      type: "标注",
      字段: "DML",
      归属车线Id: carlineId,
    },
    fabricObject: {
      type: "textbox",
      text: dmlValue,
      fontFamily: 标注样式?.字体 || "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      fill: 标注样式?.字色 || "#111111",
      left: position.x - width / 2,
      top: position.y - height / 2,
      width,
      fontSize,
      textAlign: "center",
      originX: "left",
      originY: "top",
      selectable: false,
      evented: false,
    },
  }
}

function 在高针图编辑器JSON中重建DML标注和自动化标注(graph: 高针图): string {
  if (!String(graph.json ?? "").trim()) return graph.json

  try {
    const doc = JSON.parse(graph.json) as {
      scene?: {
        nodes?: Record<string, any>
        order?: string[]
      }
      domain?: {
        车线?: any[]
        标注样式?: any
        自动修改器?: any[]
      }
    }

    const dmlNodeIds = new Set(
      Object.entries(doc.scene?.nodes ?? {})
        .filter(([, node]) => node?.business?.type === "标注" && node.business?.字段 === "DML")
        .map(([nodeId]) => nodeId)
    )
    const nextNodes = Object.fromEntries(
      Object.entries(doc.scene?.nodes ?? {})
        .filter(([nodeId]) => !dmlNodeIds.has(nodeId))
        .map(([nodeId, node]) => {
          if (node?.business?.type !== "车线") return [nodeId, node]
          const next标注NodeId = { ...(node.business.标注NodeId ?? {}) }
          delete next标注NodeId.DML
          const nextBusiness = {
            ...node.business,
            标注NodeId: next标注NodeId,
          }
          delete nextBusiness.DML
          return [nodeId, { ...node, business: nextBusiness }]
        })
    )
    const nextOrder = (doc.scene?.order ?? []).filter(nodeId => !dmlNodeIds.has(nodeId))

    const sceneCarlineNodeIdByBusinessId = new Map<string, string>()
    Object.entries(nextNodes).forEach(([nodeId, node]) => {
      if (node?.business?.type !== "车线") return
      const businessId = String(node.business.id ?? "").trim()
      if (!businessId) return
      sceneCarlineNodeIdByBusinessId.set(businessId, nodeId)
    })

    const usedNodeIds = new Set([...Object.keys(nextNodes), ...nextOrder])
    const createDmlNodeId = (carlineId: string) => {
      const base = `dml-${carlineId || "carline"}`
      if (!usedNodeIds.has(base)) {
        usedNodeIds.add(base)
        return base
      }
      let index = 2
      while (usedNodeIds.has(`${base}-${index}`)) {
        index++
      }
      const nodeId = `${base}-${index}`
      usedNodeIds.add(nodeId)
      return nodeId
    }

    const next车线 = graph.车线.map(carline => {
      const dml = isValidDmlValue(carline.DML) ? carline.DML : undefined
      const next标注NodeId = { ...(carline.标注NodeId ?? {}) }
      delete next标注NodeId.DML

      const sceneCarlineNodeId = sceneCarlineNodeIdByBusinessId.get(carline.id)
      const sceneCarlineNode = sceneCarlineNodeId ? nextNodes[sceneCarlineNodeId] : undefined
      if (!dml || !sceneCarlineNodeId || !sceneCarlineNode) {
        return {
          ...carline,
          标注NodeId: next标注NodeId,
        }
      }

      const codeLabelNode = Object.values(nextNodes).find(
        node =>
          node?.business?.type === "标注" &&
          node.business?.字段 === "车线编号" &&
          node.business?.归属车线Id === carline.id
      )
      const position = codeLabelNode
        ? resolve编辑器文本节点中心(codeLabelNode)
        : resolve编辑器文本节点中心(sceneCarlineNode)
      const dmlNodeId = createDmlNodeId(carline.id)

      nextNodes[sceneCarlineNodeId] = {
        ...sceneCarlineNode,
        business: {
          ...sceneCarlineNode.business,
          DML: dml,
          标注NodeId: {
            ...(sceneCarlineNode.business?.标注NodeId ?? {}),
            DML: dmlNodeId,
          },
        },
      }
      nextNodes[dmlNodeId] = 创建DML标注节点(
        dmlNodeId,
        carline.id,
        dml,
        position,
        graph.标注样式?.DML
      )
      nextOrder.push(dmlNodeId)

      return {
        ...carline,
        标注NodeId: {
          ...next标注NodeId,
          DML: dmlNodeId,
        },
      }
    })

    return JSON.stringify({
      ...doc,
      scene: doc.scene
        ? {
            ...doc.scene,
            nodes: nextNodes,
            order: nextOrder,
          }
        : doc.scene,
      domain: {
        ...(doc.domain ?? {}),
        车线: next车线,
        标注样式: graph.标注样式 ?? doc.domain?.标注样式 ?? {},
        自动修改器: graph.自动修改器 ?? [],
      },
    })
  } catch {
    return graph.json
  }
}

function normalize手织图类型(type: unknown): "横排" | "方形" | "特殊" | "" {
  if (type === "横排" || type === "方形" || type === "特殊") return type
  return ""
}

function shouldOverride手织图类型(
  aType: unknown,
  bType: unknown
): aType is "横排" | "方形" | "特殊" {
  const a = normalize手织图类型(aType)
  const b = normalize手织图类型(bType)
  const isRowOrSquare = (t: string) => t === "横排" || t === "方形"
  // Only handle the row/square swap case requested:
  // B is 横排/方形 and A is 方形/横排 (opposite) -> use B.
  return isRowOrSquare(a) && isRowOrSquare(b) && a !== b
}

function 获取C稿手织图(
  fileA: 沐茵丝假发成品稿,
  fileB: 沐茵丝假发成品稿
): 沐茵丝假发成品稿["手织指示单"]["手织图"] {
  const a = fileA.手织指示单?.手织图
  const b = fileB.手织指示单?.手织图
  if (!a || !b) return a ?? b

  if (shouldOverride手织图类型(a.间色比例?.type, b.间色比例?.type)) {
    // Keep C稿以A为底的原则不变，只在横排/方形互换时，用B稿手织图替换，避免类型不一致。
    return 深拷贝普通对象(b)
  }
  return a
}

function normalizeLevelName(name: string): string {
  return String(name ?? "")
    .trim()
    .replace(/档$/u, "")
    .trim()
}

function clamp01(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(num)) return 0
  const normalized = Math.abs(num) > 1 ? num / 100 : num
  return Math.max(0, Math.min(1, normalized))
}

function parse车线排序值(value: unknown): number | null {
  const raw = String(value ?? "").trim()
  if (!raw) return null
  const normalized = raw.replace(/[^0-9.+-]/g, "")
  if (!normalized) return null
  const num = Number(normalized)
  return Number.isFinite(num) ? num : null
}

function compare车线顺序(
  a: Pick<高针图["车线"][number], "车线编号" | "id">,
  b: Pick<高针图["车线"][number], "车线编号" | "id">
): number {
  const numA = parse车线排序值(a.车线编号)
  const numB = parse车线排序值(b.车线编号)
  if (numA != null && numB != null && numA !== numB) {
    return numA - numB
  }
  if (numA != null && numB == null) return -1
  if (numA == null && numB != null) return 1

  const codeCompare = String(a.车线编号 ?? "").localeCompare(String(b.车线编号 ?? ""), undefined, {
    numeric: true,
    sensitivity: "base",
  })
  if (codeCompare !== 0) return codeCompare
  return String(a.id ?? "").localeCompare(String(b.id ?? ""))
}

function isValidDmlValue(value: unknown): value is DML值 {
  return value === "D" || value === "M" || value === "L"
}

type 区域覆盖段 = { start: number; end: number }

function merge覆盖段列表(segments: 区域覆盖段[]): 区域覆盖段[] {
  if (segments.length <= 1) return segments.slice()
  const sorted = [...segments].sort((a, b) => a.start - b.start || a.end - b.end)
  const merged: 区域覆盖段[] = [sorted[0]]
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]
    const prev = merged[merged.length - 1]
    if (current.start <= prev.end) {
      prev.end = Math.max(prev.end, current.end)
      continue
    }
    merged.push({ ...current })
  }
  return merged
}

function normalizeDmlPatternKey(pattern: DML值[]): string {
  return pattern.join("|")
}

function 归并按区域自动修改器(
  modifiers: 高针图["自动修改器"],
  regionOrderHint: string[]
): 高针图["自动修改器"] {
  const grouped = new Map<
    string,
    {
      pattern: DML值[]
      regionMap: Map<string, 区域覆盖段[]>
    }
  >()

  modifiers.forEach(mod => {
    if (!mod || mod.type !== "按区域自动标注DML") return
    const pattern = normalizePattern(mod.规律)
    if (pattern.length === 0) return

    const key = normalizeDmlPatternKey(pattern)
    const current = grouped.get(key) ?? {
      pattern,
      regionMap: new Map<string, 区域覆盖段[]>(),
    }

    ;(mod.范围 ?? []).forEach(seg => {
      const region = String(seg.区域 ?? "").trim()
      if (!region) return
      const next = [
        ...(current.regionMap.get(region) ?? []),
        {
          start: clamp01(seg.开始),
          end: clamp01(seg.结束),
        },
      ]
      current.regionMap.set(region, merge覆盖段列表(next))
    })

    grouped.set(key, current)
  })

  const regionRank = new Map<string, number>(regionOrderHint.map((name, index) => [name, index]))
  const result: 高针图["自动修改器"] = []

  Array.from(grouped.values()).forEach(item => {
    const 范围 = Array.from(item.regionMap.entries())
      .sort(([regionA], [regionB]) => {
        const rankA = regionRank.get(regionA) ?? 9999
        const rankB = regionRank.get(regionB) ?? 9999
        if (rankA !== rankB) return rankA - rankB
        return regionA.localeCompare(regionB, undefined, { numeric: true, sensitivity: "base" })
      })
      .flatMap(([region, segments]) =>
        merge覆盖段列表(segments).map(seg => ({
          区域: region,
          开始: seg.start,
          结束: seg.end,
        }))
      )

    if (范围.length === 0) return
    result.push({
      type: "按区域自动标注DML",
      id: createRuleId("ab_auto"),
      规律: [...item.pattern],
      范围,
    })
  })

  return result
}

function buildRegionOrderHint(graph: 高针图): string[] {
  const preset = 高针图系统预置区域列表.map(d => d.name)
  const presetSet = new Set(preset)
  const existed = Array.from(
    new Set(graph.车线.map(c => String(c.区域 ?? "").trim()).filter(Boolean))
  )
  const extra = existed.filter(name => !presetSet.has(name)).sort()
  return [...preset, ...extra]
}

function orderCarlinesInRegion(graph: 高针图, region: string): 高针图["车线"] {
  return graph.车线.filter(c => c.区域 === region).sort(compare车线顺序)
}

function orderCarlinesByRegionAndNumber(graph: 高针图): 高针图["车线"] {
  const regionOrder = buildRegionOrderHint(graph)
  const rank = new Map<string, number>(regionOrder.map((name, i) => [name, i]))
  return [...graph.车线].sort((a, b) => {
    const ra = rank.get(a.区域) ?? 9999
    const rb = rank.get(b.区域) ?? 9999
    if (ra !== rb) return ra - rb
    return compare车线顺序(a, b)
  })
}

function selectByPercent<T>(items: T[], start: unknown, end: unknown): T[] {
  if (items.length === 0) return []
  const from = Math.min(clamp01(start), clamp01(end))
  const to = Math.max(clamp01(start), clamp01(end))
  if (from === to) {
    return [items[Math.min(items.length - 1, Math.floor(from * items.length))]]
  }
  return items.filter((_, index) => {
    const itemStart = index / items.length
    const itemEnd = (index + 1) / items.length
    return itemStart < to && itemEnd > from
  })
}

function build档位区域覆盖映射(graph: 高针图): Map<string, Map<string, 区域覆盖段[]>> {
  const out = new Map<string, Map<string, 区域覆盖段[]>>()
  const regionOrder = buildRegionOrderHint(graph)

  regionOrder.forEach(regionName => {
    const regionItems = orderCarlinesInRegion(graph, regionName)
    if (regionItems.length === 0) return

    const slotToIndexes = new Map<string, number[]>()
    regionItems.forEach((c, index) => {
      const slot = normalizeLevelName(c.档位)
      if (!slot) return
      const list = slotToIndexes.get(slot) ?? []
      list.push(index)
      slotToIndexes.set(slot, list)
    })

    slotToIndexes.forEach((indexes, slot) => {
      if (indexes.length === 0) return
      const start = indexes[0] / regionItems.length
      const end = (indexes[indexes.length - 1] + 1) / regionItems.length
      const regionMap = out.get(slot) ?? new Map<string, 区域覆盖段[]>()
      const next = [...(regionMap.get(regionName) ?? []), { start, end }]
      regionMap.set(regionName, merge覆盖段列表(next))
      out.set(slot, regionMap)
    })
  })

  return out
}

function 收集染色区域覆盖(
  slotNames: string[],
  slotCoverage: Map<string, Map<string, 区域覆盖段[]>>
): Map<string, 区域覆盖段[]> {
  const out = new Map<string, 区域覆盖段[]>()
  slotNames.forEach(slot => {
    const regionMap = slotCoverage.get(slot)
    if (!regionMap) return
    regionMap.forEach((segments, regionName) => {
      const next = [...(out.get(regionName) ?? []), ...segments]
      out.set(regionName, merge覆盖段列表(next))
    })
  })
  return out
}

function 覆盖段有重叠(a: 区域覆盖段, b: 区域覆盖段): boolean {
  return Math.min(a.end, b.end) > Math.max(a.start, b.start)
}

function 是否命中染色区域(
  slot: string,
  targetCoverage: Map<string, Map<string, 区域覆盖段[]>>,
  dyedCoverage: Map<string, 区域覆盖段[]>
): boolean {
  const regionMap = targetCoverage.get(slot)
  if (!regionMap) return false

  for (const [regionName, targetSegments] of regionMap.entries()) {
    const dyedSegments = dyedCoverage.get(regionName)
    if (!dyedSegments || dyedSegments.length === 0) continue
    for (const targetSegment of targetSegments) {
      if (dyedSegments.some(dyed => 覆盖段有重叠(targetSegment, dyed))) {
        return true
      }
    }
  }

  return false
}

function 转换B稿染色档位列表到C稿(fileA: 沐茵丝假发成品稿, fileB: 沐茵丝假发成品稿): 染色档位[] {
  const sourceList = 深拷贝普通对象(fileB.染色档位列表 ?? []) as 染色档位[]
  if (sourceList.length === 0) return sourceList

  const aMachineSlotOrder = (fileA.制品规格书.机器规格清单 ?? [])
    .map(row => normalizeLevelName(row.档位))
    .filter(Boolean)
  const aMachineSlotSet = new Set(aMachineSlotOrder)
  const bMachineSlotSet = new Set(
    (fileB.制品规格书.机器规格清单 ?? []).map(row => normalizeLevelName(row.档位)).filter(Boolean)
  )
  const bCoverage = build档位区域覆盖映射(fileB.高针指示单.高针图 as unknown as 高针图)
  const aCoverage = build档位区域覆盖映射(fileA.高针指示单.高针图 as unknown as 高针图)

  return sourceList.map(item => {
    const rawSlots = (item.染色图?.档位标注?.档位列表 ?? [])
      .map(slot => normalizeLevelName(slot))
      .filter(Boolean)
    const machineSlots = rawSlots.filter(slot => bMachineSlotSet.has(slot))
    const passThroughSlots = rawSlots.filter(slot => !bMachineSlotSet.has(slot))

    // 只有人工档位染色，直接 pass
    if (machineSlots.length === 0) return item

    const dyedCoverage = 收集染色区域覆盖(machineSlots, bCoverage)
    let mappedMachineSlots = aMachineSlotOrder.filter(slot =>
      是否命中染色区域(slot, aCoverage, dyedCoverage)
    )

    if (mappedMachineSlots.length === 0) {
      mappedMachineSlots = machineSlots.filter(slot => aMachineSlotSet.has(slot))
    }

    return {
      ...item,
      染色图: {
        ...item.染色图,
        档位标注: {
          ...item.染色图.档位标注,
          档位列表: Array.from(new Set([...mappedMachineSlots, ...passThroughSlots])),
        },
      },
    } as 染色档位
  })
}

function createRuleId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
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

function compileDmlAssignments(graph: 高针图): Map<string, DML值> {
  const result = new Map<string, DML值>()
  const orderedByRegion = orderCarlinesByRegionAndNumber(graph)
  const applyPattern = (items: 高针图["车线"], pattern: DML值[]) => {
    items.forEach((c, i) => result.set(c.id, pattern[i % pattern.length]))
  }

  ;(graph.自动修改器 ?? []).forEach(mod => {
    if (!mod) return
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

function 将DML标记写回高针图数据(graph: 高针图, 记录日志?: 调试日志函数): 高针图 {
  const dmlAssignments = compileDmlAssignments(graph)
  let assigned = 0

  const nextGraph = {
    ...graph,
    车线: graph.车线.map(carline => {
      const next标注NodeId = { ...(carline.标注NodeId ?? {}) }
      delete next标注NodeId.DML

      const dml =
        dmlAssignments.get(carline.id) ?? (isValidDmlValue(carline.DML) ? carline.DML : "D")
      if (dmlAssignments.has(carline.id)) {
        assigned++
      }

      return {
        ...carline,
        DML: dml,
        标注NodeId: next标注NodeId,
      }
    }),
  }
  const withJson = {
    ...nextGraph,
    json: 在高针图编辑器JSON中重建DML标注和自动化标注(nextGraph),
  }
  const written = withJson.车线.filter(carline =>
    String(carline.标注NodeId?.DML ?? "").trim()
  ).length

  记录日志?.("高针图DML写回数据摘要", {
    assignmentCount: dmlAssignments.size,
    assignedCount: assigned,
    writtenCount: written,
    skippedNoNodeId: withJson.车线.length - written,
  })

  return withJson
}

function 转换按档位范围为区域范围(
  sourceGraph: 高针图,
  seg: { 档位: string; 开始: number; 结束: number }
): Array<{ 区域: string; 开始: number; 结束: number }> {
  const gear = normalizeLevelName(String(seg.档位 ?? ""))
  if (!gear) return []

  const ordered = orderCarlinesByRegionAndNumber(sourceGraph)
  const gearItems = ordered.filter(c => normalizeLevelName(c.档位) === gear)
  const selected = selectByPercent(gearItems, seg.开始, seg.结束)
  if (selected.length === 0) return []

  const byRegion = new Map<string, { min: number; max: number; len: number }>()
  selected.forEach(c => {
    const region = String(c.区域 ?? "").trim()
    if (!region) return
    const regionAll = orderCarlinesInRegion(sourceGraph, region)
    if (regionAll.length === 0) return
    const index = regionAll.findIndex(x => x.id === c.id)
    if (index < 0) return
    const prev = byRegion.get(region)
    if (!prev) {
      byRegion.set(region, { min: index, max: index, len: regionAll.length })
      return
    }
    prev.min = Math.min(prev.min, index)
    prev.max = Math.max(prev.max, index)
  })

  const regionOrder = buildRegionOrderHint(sourceGraph)
  return regionOrder
    .filter(region => byRegion.has(region))
    .map(region => {
      const stat = byRegion.get(region)!
      return {
        区域: region,
        开始: stat.min / stat.len,
        结束: (stat.max + 1) / stat.len,
      }
    })
}

function 映射B稿自动修改器到A稿并转为按区域(
  targetGraph: 高针图,
  sourceGraph: 高针图,
  记录日志?: 调试日志函数
): 高针图["自动修改器"] {
  const targetRegions = new Set(
    targetGraph.车线.map(c => String(c.区域 ?? "").trim()).filter(Boolean)
  )
  const out: 高针图["自动修改器"] = []

  ;(sourceGraph.自动修改器 ?? []).forEach(mod => {
    if (!mod) return
    const pattern = normalizePattern(mod.规律)
    if (pattern.length === 0) return

    const base = {
      id: createRuleId("ab_auto"),
      规律: pattern,
    }

    if (mod.type === "按区域自动标注DML") {
      const 范围 = (mod.范围 ?? [])
        .map(seg => ({
          区域: String(seg.区域 ?? "").trim(),
          开始: clamp01(seg.开始),
          结束: clamp01(seg.结束),
        }))
        .filter(seg => seg.区域 && targetRegions.has(seg.区域))
      if (范围.length === 0) return
      out.push({ type: "按区域自动标注DML", ...base, 范围 })
      return
    }

    if (mod.type === "按档位自动标注DML") {
      const 范围 = (mod.范围 ?? [])
        .flatMap(seg => 转换按档位范围为区域范围(sourceGraph, seg))
        .map(seg => ({
          区域: String(seg.区域 ?? "").trim(),
          开始: clamp01(seg.开始),
          结束: clamp01(seg.结束),
        }))
        .filter(seg => seg.区域 && targetRegions.has(seg.区域))
      if (范围.length === 0) return
      out.push({ type: "按区域自动标注DML", ...base, 范围 })
      return
    }
  })

  const merged = 归并按区域自动修改器(out, buildRegionOrderHint(targetGraph))

  记录日志?.("上下分自动修改器映射摘要", {
    sourceCount: sourceGraph.自动修改器?.length ?? 0,
    mappedCount: out.length,
    mergedCount: merged.length,
  })
  return merged
}

function strip机器规格清单到单D尺数(
  rows: 沐茵丝假发成品稿["制品规格书"]["机器规格清单"]
): 沐茵丝假发成品稿["制品规格书"]["机器规格清单"] {
  return rows.map(row => ({
    ...row,
    双针: {
      ...row.双针,
      尺数: { D: row.双针.尺数.D },
    },
  }))
}

// C 稿公共底稿：以 A 为底，覆盖 B 的类型、染色图、胶丝比例。
function 构建C稿公共底稿(fileA: 沐茵丝假发成品稿, fileB: 沐茵丝假发成品稿): 沐茵丝假发成品稿 {
  const next高针图 = 清空高针图DML标注和自动化标注(fileA.高针指示单.高针图)
  const next手织图 = 获取C稿手织图(fileA, fileB)

  return {
    ...fileA,
    假发类型: fileB.假发类型,
    染色档位列表: 转换B稿染色档位列表到C稿(fileA, fileB),
    制品规格书: {
      ...fileA.制品规格书,
      胶丝比例id: fileB.制品规格书.胶丝比例id,
    },
    高针指示单: {
      ...fileA.高针指示单,
      高针图: next高针图,
    },
    手织指示单: {
      ...fileA.手织指示单,
      手织图: next手织图,
    },
  }
}

function 获取B稿间色比值(b稿: 沐茵丝假发成品稿, index: number): DML比值 {
  const ratio =
    b稿.制品规格书.机器规格清单[index]?.DML比值 ??
    b稿.制品规格书.机器规格清单.find(row => row.DML比值 != null)?.DML比值

  if (ratio) {
    return {
      D: ratio.D,
      M: ratio.M,
      L: ratio.L,
    }
  }

  return { D: 1, L: 1 }
}

function 按档位重算DML重量<T>(
  rows: T[],
  获取比值: (index: number) => DML比值,
  重算行: (rows: T[], ratio: DML比值) => T[]
): T[] {
  return rows.map((row, index) => 重算行([row], 获取比值(index))[0])
}

function 生成上下分图稿(
  c稿: 沐茵丝假发成品稿,
  b稿: 沐茵丝假发成品稿,
  记录日志?: 调试日志函数
): Pick<沐茵丝假发成品稿, "高针指示单" | "手织指示单"> {
  const mappedAutoModifiers = 映射B稿自动修改器到A稿并转为按区域(
    c稿.高针指示单.高针图 as unknown as 高针图,
    b稿.高针指示单.高针图 as unknown as 高针图,
    记录日志
  )
  const 高针图 = 将DML标记写回高针图数据(
    {
      ...(c稿.高针指示单.高针图 as unknown as 高针图),
      自动修改器: mappedAutoModifiers,
    },
    记录日志
  )

  const 手织图 = c稿.手织指示单.手织图

  // #region debug-point D:split-graph-output
  记录日志?.("生成上下分图稿结果摘要", {
    高针图自动修改器数: (高针图 as unknown as 高针图).自动修改器?.length ?? 0,
    B稿高针图自动修改器数: (b稿.高针指示单.高针图 as unknown as 高针图).自动修改器?.length ?? 0,
    手织图类型: 手织图.间色比例.type,
    B稿手织图类型: b稿.手织指示单.手织图.间色比例.type,
  })
  // #endregion

  return {
    高针指示单: {
      ...c稿.高针指示单,
      高针图: 高针图 as unknown as 沐茵丝假发成品稿["高针指示单"]["高针图"],
    },
    手织指示单: {
      ...c稿.手织指示单,
      手织图,
    },
  }
}

function 按上下分图稿回算机器规格清单(
  c稿: 沐茵丝假发成品稿,
  高针图: 沐茵丝假发成品稿["高针指示单"]["高针图"],
  splitFlags: 上下分标记,
  记录日志?: 调试日志函数
): 沐茵丝假发成品稿["制品规格书"]["机器规格清单"] {
  const baseRows = strip机器规格清单到单D尺数(c稿.制品规格书.机器规格清单)
  const graph = 高针图 as 高针图
  const dmlAssignments = compileDmlAssignments(graph)

  baseRows.forEach(row => {
    const normalizedSlot = normalizeLevelName(row.档位)
    const matchedCarlines = graph.车线.filter(c => normalizeLevelName(c.档位) === normalizedSlot)
    const contributions = matchedCarlines.map(carline => {
      const dml =
        dmlAssignments.get(carline.id) ?? (isValidDmlValue(carline.DML) ? carline.DML : "D")
      const baseLength = Number.isFinite(carline.尺数) ? carline.尺数 : 0
      const multiplier = carline.是双数 ? 2 : 1
      const totalLength = baseLength * multiplier

      return {
        车线id: carline.id,
        区域: carline.区域,
        车线编号: carline.车线编号,
        DML: dml,
        公式: multiplier === 1 ? `${baseLength}` : `${baseLength}*${multiplier}`,
        结果: totalLength,
      }
    })

    const grouped = {
      D: contributions.filter(item => item.DML === "D"),
      M: contributions.filter(item => item.DML === "M"),
      L: contributions.filter(item => item.DML === "L"),
    }
    const sumGroup = (items: typeof contributions) =>
      items.reduce((sum, item) => sum + item.结果, 0)
    const buildFormula = (items: typeof contributions) =>
      items.length === 0 ? "0" : items.map(item => item.公式).join(" + ")

    记录日志?.("上下分尺数计算公式", {
      档位: row.档位,
      参与车线数: matchedCarlines.length,
      D公式: buildFormula(grouped.D),
      D结果: sumGroup(grouped.D),
      M公式: splitFlags.hasM ? buildFormula(grouped.M) : undefined,
      M结果: splitFlags.hasM ? sumGroup(grouped.M) : undefined,
      L公式: splitFlags.hasL ? buildFormula(grouped.L) : undefined,
      L结果: splitFlags.hasL ? sumGroup(grouped.L) : undefined,
      明细: contributions,
    })
  })

  return shared按高针图回算机器规格清单上下分尺数(baseRows, graph, splitFlags)
}

function 提取图稿DML全局标记(graph: 高针图): 上下分标记 {
  return shared提取高针图上下分标记(graph)
}

function 按B稿纯色规则生成C稿(fileA: 沐茵丝假发成品稿, fileB: 沐茵丝假发成品稿): 沐茵丝假发成品稿 {
  /* 
  1. 使用B的染色类型——纯色
  2. 将A稿的DML标记清空如有
  4. 计算机器规格清单
    - 只用A稿D尺数，计算得到D重量
  5. 计算人工规格清单
    - A稿人工规格档位<B稿人工规格档位
      - A稿该档所有DML重量加起来，B稿计算该档D的重量（包括裁断），M的重量（如有），L的重量（如有），计算DML的重量比值，按照该比值应用到A稿，先得到A稿D，M，L重量，然后看B稿对应裁断，然后填写每行重量
    - A稿人工规格档位>B稿人工规格档位
      - A稿档位多于B稿档位的档位，直接使用A稿的，如A有H3，B只有H2，C稿取A稿H3，不做处理
      - 少于等于的档位：- A稿该档所有DML重量加起来，B稿计算该档D的重量（包括裁断），M的重量（如有），L的重量（如有），计算DML的重量比值，按照该比值应用到A稿，先得到A稿D，M，L重量，然后看B稿对应裁断，然后填写每行重量
  6. 剩下的都使用A稿数据
  */
  const fileC = 构建C稿公共底稿(fileA, fileB)
  const machineRows = strip机器规格清单到单D尺数(fileC.制品规格书.机器规格清单)

  return {
    ...fileC,
    制品规格书: {
      ...fileC.制品规格书,
      机器规格清单: recalc机器规格清单D重量(machineRows),
      人工规格清单: recalc人工规格清单D重量(fileC.制品规格书.人工规格清单),
    },
  }
}

function 按B稿间色规则生成C稿(fileA: 沐茵丝假发成品稿, fileB: 沐茵丝假发成品稿): 沐茵丝假发成品稿 {
  /* 
  1. 使用B的染色类型——间色
  2. 将A稿的DML标记清空如有
  4. 计算机器规格清单
    - A稿人工规格档位<=B稿人工规格档位
      - 如果B稿档位比例都是一样的：那么A稿所有机器档位都按照这个比例计算DML重量
      - 如果B稿档位比例不同：按照A稿档位对应B稿档位比例计算DML重量
    - A稿人工规格档位>B稿人工规格档位
      - 如果B稿档位比例都是一样的：那么A稿所有机器档位都按照这个比例计算DML重量
      // TODO,后续再完善
      - 如果B稿档位比例不同：A,B稿都有的档位按照比例计算DML重量，A稿多的档位按照固定D:M:L=1:1:0.5计算
  5. 计算人工规格清单
    - A稿人工规格档位<=B稿人工规格档位（这里就不需要计算比值，间色会存在比值）
      - A稿该档所有DML重量加起来，B稿计算该档D的重量（包括裁断），M的重量（如有），L的重量（如有），计算DML的重量比值，按照该比值应用到A稿，先得到A稿D，M，L重量，然后看B稿对应裁断，然后填写每行重量
    - A稿人工规格档位>B稿人工规格档位（这里就不需要计算比值，间色会存在比值）
      - A稿档位多于B稿档位的档位，直接使用A稿的，如A有H3，B只有H2，C稿取A稿H3，不做处理
      - 少于等于的档位：- A稿该档所有DML重量加起来，B稿计算该档D的重量（包括裁断），M的重量（如有），L的重量（如有），计算DML的重量比值，按照该比值应用到A稿，先得到A稿D，M，L重量，然后看B稿对应裁断，然后填写每行重量
  6. 剩下的都使用A稿数据
  */
  const fileC = 构建C稿公共底稿(fileA, fileB)
  const machineRows = strip机器规格清单到单D尺数(fileC.制品规格书.机器规格清单)

  return {
    ...fileC,
    制品规格书: {
      ...fileC.制品规格书,
      机器规格清单: 按档位重算DML重量(
        machineRows,
        index => 获取B稿间色比值(fileB, index),
        recalc机器规格清单按比例DML重量
      ),
      人工规格清单: 按档位重算DML重量(
        fileC.制品规格书.人工规格清单,
        index => 获取B稿间色比值(fileB, index),
        recalc人工规格清单按比例DML重量
      ),
    },
  }
}

function 按B稿上下分规则生成C稿(
  fileA: 沐茵丝假发成品稿,
  fileB: 沐茵丝假发成品稿,
  记录日志?: 调试日志函数
): 沐茵丝假发成品稿 {
  /* 
  1. 使用B的染色类型——上下分
  2. 将A稿的DML标记清空如有
  //TODO，后续再完善
  -- DML规律标注在高针图区域线条顺序数字节点相同的位置
  3. 按照B稿标记A稿DML
  - 判断B稿高针图标记规律
  - 如果是区域规律
    - 如果有相同区域，按照百分比在对应区域范围标注DML
    - 如果没有相同区域：PASS
  - 如果是按档规律
    - 在B稿档位寻找对应区域位置：如1档位1-100对应区域是[尾巴50-100，松颈0-20]
    - 如果对应区域位置和A稿有相同区域就对应区域百分比标注DML
    - 如果没有相同区域：PASS

  - 如果是特殊规律
    - pass
  4. 计算机器规格清单
    - 每档DML尺数都是通过高针图对应档位标注的DML数量计算得到的，如果标注的线条是双针，那么DML尺数是2倍，档位线条D长度=区域线条长度*D标记数量*2(如果是双)
  5. 计算人工规格清单
    - A稿人工规格档位<B稿人工规格档位
      - A稿该档所有DML重量加起来，B稿计算该档D的重量（包括裁断），M的重量（如有），L的重量（如有），计算DML的重量比值，按照该比值应用到A稿，先得到A稿D，M，L重量，然后看B稿对应裁断，然后填写每行重量
    - A稿人工规格档位>B稿人工规格档位
      - A稿档位多于B稿档位的档位，直接使用A稿的，如A有H3，B只有H2，C稿取A稿H3，不做处理
      - 少于等于的档位：- A稿该档所有DML重量加起来，B稿计算该档D的重量（包括裁断），M的重量（如有），L的重量（如有），计算DML的重量比值，按照该比值应用到A稿，先得到A稿D，M，L重量，然后看B稿对应裁断，然后填写每行重量
  6. 剩下的都使用A稿数据
  */
  const fileC = 构建C稿公共底稿(fileA, fileB)
  const 图稿 = 生成上下分图稿(fileC, fileB, 记录日志)
  const splitFlags = 提取图稿DML全局标记(图稿.高针指示单.高针图 as 高针图)
  const machineRows = 按上下分图稿回算机器规格清单(
    fileC,
    图稿.高针指示单.高针图,
    splitFlags,
    记录日志
  )

  // #region debug-point D:split-generate-summary
  记录日志?.("上下分生成摘要", {
    machineRowCount: machineRows.length,
    splitHasM: splitFlags.hasM,
    splitHasL: splitFlags.hasL,
    高针图自动修改器数: (图稿.高针指示单.高针图 as unknown as 高针图).自动修改器?.length ?? 0,
    手织图类型: 图稿.手织指示单.手织图.间色比例.type,
  })
  // #endregion

  return {
    ...fileC,
    制品规格书: {
      ...fileC.制品规格书,
      机器规格清单: recalc机器规格清单上下分重量(machineRows, splitFlags),
      人工规格清单: recalc人工规格清单上下分重量(fileC.制品规格书.人工规格清单, splitFlags),
    },
    ...图稿,
  }
}

function 根据B稿类型生成C稿(
  fileA: 沐茵丝假发成品稿,
  fileB: 沐茵丝假发成品稿,
  记录日志?: 调试日志函数
): 沐茵丝假发成品稿 {
  switch (fileB.假发类型) {
    case 假发类型.纯色:
      return 按B稿纯色规则生成C稿(fileA, fileB)
    case 假发类型.间色:
      return 按B稿间色规则生成C稿(fileA, fileB)
    case 假发类型.上下分:
      return 按B稿上下分规则生成C稿(fileA, fileB, 记录日志)
    default:
      return 构建C稿公共底稿(fileA, fileB)
  }
}

export default async function (call: ApiCall<ReqGenerateByAB, ResGenerateByAB>) {
  const { fileAId, fileBId } = call.req
  const 记录日志: 调试日志函数 = (阶段, data) => {
    call.logger.log(`[GenerateByAB][上下分调试] ${阶段} ${JSON.stringify(data)}`)
  }

  if (fileAId === fileBId) {
    return call.error("文件A和文件B不能相同")
  }
  if (!ObjectId.isValid(fileAId) || !ObjectId.isValid(fileBId)) {
    return call.error("文件A或文件B不存在")
  }

  const [fileA, fileB] = await Promise.all([
    Global.getCollection("沐茵丝假发成品稿").findOne({ _id: new ObjectId(fileAId) }),
    Global.getCollection("沐茵丝假发成品稿").findOne({ _id: new ObjectId(fileBId) }),
  ])
  if (!fileA || !fileB) {
    return call.error("文件A或文件B不存在")
  }

  const fileC = 根据B稿类型生成C稿(fileA, fileB, 记录日志)

  call.succ({ file: fileC })
}
