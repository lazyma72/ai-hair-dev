import { ApiCall } from "tsrpc"
import {
  ReqGenerateByAB,
  ResGenerateByAB,
} from "../../../shared/protocols/admin/file/PtlGenerateByAB"
import { Global } from "../../../models/Global"
import { 假发类型, type 沐茵丝假发成品稿 } from "../../../shared/db/Db沐茵丝假发成品稿"
import type { DML值, DML规则命令, DML规则命令列表 } from "../../../shared/models/DML规则"
import {
  recalc人工规格清单D重量,
  recalc人工规格清单上下分重量,
  recalc人工规格清单按比例DML重量,
  recalc机器规格清单D重量,
  recalc机器规格清单上下分重量,
  recalc机器规格清单按比例DML重量,
} from "../../../shared/models/重量计算"
import { ObjectId } from "mongodb"
import type { 高针图 } from "../../../shared/models/高针图"
import { load } from "cheerio"

type GraphLike = {
  底图: {
    svg?: string
    区域名?: string[]
    区域线条?: {
      区域名: string
      sortNodeId?: string
      lineNodeId: string
      sort: number
      lineLength: number
      textNodeIds?: string[]
    }[]
    档位标注?: {
      区域名: string
      lineNodeIds: string[]
      textNodeIds?: string[]
    }[]
    文本节点?: Record<
      string,
      {
        textNodeId: string
        text?: string
        created?: boolean
        fontStyle?: Record<string, unknown>
      }
    >
  }
  自定义数据: {
    DML规则命令列表: DML规则命令列表
  }
}

type RegionLine = {
  区域名: string
  lineNodeId: string
  sort: number
  lineLength: number
}

type DML比值 = {
  D: number
  M?: number
  L?: number
}

type 调试日志函数 = (阶段: string, data: Record<string, unknown>) => void

type SvgPoint = {
  x: number
  y: number
}

type DML标注锚点 = {
  textNodeId: string
  source: "region" | "existing-dml" | "level"
  pos: SvgPoint
}

type 图文本节点 = NonNullable<GraphLike["底图"]["文本节点"]>[string]

function 深拷贝普通对象<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

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

function normalizeSort(value: unknown, fallback: number): number {
  const num = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(num) || num < 1) return fallback + 1
  return Math.floor(num)
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

// 统一整理线条顺序，后面的 DML 计算和规则映射都按这个顺序走。
function getRegionLines(graph: GraphLike): RegionLine[] {
  return (graph.底图.区域线条 ?? [])
    .map((item, index) => ({
      区域名: String(item.区域名 ?? "").trim(),
      lineNodeId: String(item.lineNodeId ?? "").trim(),
      sort: normalizeSort(item.sort, index),
      lineLength: typeof item.lineLength === "number" ? item.lineLength : 0,
      index,
    }))
    .filter(item => item.lineNodeId)
    .sort((a, b) => a.sort - b.sort || a.index - b.index)
    .map(({ index: _index, ...item }, index) => ({
      ...item,
      sort: index + 1,
    }))
}

function getRegionSet(graph: GraphLike): Set<string> {
  const out = new Set<string>()
  ;(graph.底图.区域名 ?? []).forEach(name => {
    const region = String(name ?? "").trim()
    if (region) out.add(region)
  })
  getRegionLines(graph).forEach(line => {
    if (line.区域名) out.add(line.区域名)
  })
  return out
}

function getRegionLinesByName(graph: GraphLike): Map<string, RegionLine[]> {
  const out = new Map<string, RegionLine[]>()
  getRegionLines(graph).forEach(line => {
    const list = out.get(line.区域名) ?? []
    list.push(line)
    out.set(line.区域名, list)
  })
  return out
}

function getLevelLineIds(graph: GraphLike): Map<string, string[]> {
  const out = new Map<string, string[]>()
  ;(graph.底图.档位标注 ?? []).forEach(item => {
    const slot = normalizeLevelName(item.区域名)
    if (!slot) return
    const list = out.get(slot) ?? []
    ;(item.lineNodeIds ?? []).forEach(lineId => {
      const id = String(lineId ?? "").trim()
      if (id) list.push(id)
    })
    out.set(slot, list)
  })
  return out
}

function selectLineIdsByRange(lineIds: string[], start: unknown, end: unknown): string[] {
  if (lineIds.length === 0) return []

  const rangeStart = Math.min(clampRatio(start), clampRatio(end))
  const rangeEnd = Math.max(clampRatio(start), clampRatio(end))

  return lineIds.filter((_, index) => {
    const bucketEnd = (index + 1) / lineIds.length
    return bucketEnd > rangeStart && bucketEnd <= rangeEnd
  })
}

function collectCommandLineIds(graph: GraphLike, command: DML规则命令): string[] {
  if (command.lineNodeIds.length > 0) {
    return uniqueLineIds(command.lineNodeIds)
  }

  if (command.type === "区域百分比") {
    const byRegion = getRegionLinesByName(graph)
    return uniqueLineIds(
      (command.区域百分比 ?? []).flatMap(segment => {
        const lineIds = (byRegion.get(String(segment.区域 ?? "").trim()) ?? []).map(
          line => line.lineNodeId
        )
        return selectLineIdsByRange(lineIds, segment.开始位置, segment.结束位置)
      })
    )
  }

  if (command.type === "按档位标记") {
    const byLevel = getLevelLineIds(graph)
    return uniqueLineIds(
      (command.档位 ?? []).flatMap(segment => {
        const lineIds = byLevel.get(normalizeLevelName(segment.档位名称)) ?? []
        return selectLineIdsByRange(lineIds, segment.开始位置, segment.结束位置)
      })
    )
  }

  return []
}

// 按图里的规则给每根线算出 D/M/L。
function compileDmlAssignments(graph: GraphLike): Map<string, DML值> {
  const assignments = new Map<string, DML值>()

  for (const command of graph.自定义数据.DML规则命令列表 ?? []) {
    if (!command) continue

    if (command.type === "特殊标记") {
      if (!isValidDmlValue(command.规律)) continue
      const specialValue: DML值 = command.规律
      uniqueLineIds(command.lineNodeIds ?? []).forEach(lineId => {
        assignments.set(lineId, specialValue)
      })
      continue
    }

    const pattern = normalizePattern(command.规律)
    if (!pattern) continue

    collectCommandLineIds(graph, command).forEach((lineId, index) => {
      assignments.set(lineId, pattern[index % pattern.length] as DML值)
    })
  }

  return assignments
}

function keepSpecialRules(rules: DML规则命令列表 | undefined): DML规则命令列表 {
  return (rules ?? []).filter(rule => rule?.type === "特殊标记")
}

function createRuleId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function 获取标记文本样式(kind: "dml"): Record<string, string | number> {
  if (kind === "dml") {
    return {
      fill: "#111827",
      "font-weight": "700",
      "font-size": 10,
      "text-anchor": "middle",
      "dominant-baseline": "middle",
    }
  }
  return {}
}

function 解析首个数字(value: string | undefined): number | undefined {
  if (!value) return undefined
  const num = Number(value.trim().split(/[ ,]+/)[0])
  return Number.isFinite(num) ? num : undefined
}

function 读取文本节点位置(svg: string, textNodeId: string): SvgPoint | undefined {
  if (!svg || !textNodeId) return undefined
  const $ = load(svg, { xmlMode: true })
  const node = $(`[id="${textNodeId}"]`).first()
  if (node.length === 0) return undefined

  const firstTspan = node.find("tspan").first()
  const rawX = 解析首个数字(firstTspan.attr("x")) ?? 解析首个数字(node.attr("x")) ?? 0
  const rawY = 解析首个数字(firstTspan.attr("y")) ?? 解析首个数字(node.attr("y")) ?? 0

  const transform = String(node.attr("transform") ?? "").trim()
  const matched = transform.match(/translate\(\s*([^\s,)]+)(?:[\s,]+([^\s,)]+))?\s*\)/i)
  const tx = matched ? Number(matched[1]) : 0
  const ty = matched ? Number(matched[2] ?? "0") : 0

  return {
    x: rawX + (Number.isFinite(tx) ? tx : 0),
    y: rawY + (Number.isFinite(ty) ? ty : 0),
  }
}

function 获取线条区域标注文本节点Id(graph: GraphLike, lineNodeId: string): string {
  const line = (graph.底图.区域线条 ?? []).find(
    item => String(item.lineNodeId ?? "").trim() === lineNodeId
  )
  const sortNodeId = String(line?.sortNodeId ?? "").trim()
  if (sortNodeId) return sortNodeId
  const textNodeIds = (line?.textNodeIds ?? []).map(id => String(id ?? "").trim()).filter(Boolean)
  return textNodeIds.find(id => id.startsWith("region_text")) ?? textNodeIds[0] ?? ""
}

function 获取线条档位标注文本节点Id(graph: GraphLike, lineNodeId: string): string {
  for (const item of graph.底图.档位标注 ?? []) {
    const index = (item.lineNodeIds ?? []).findIndex(id => String(id ?? "").trim() === lineNodeId)
    if (index < 0) continue
    const textNodeId = String(item.textNodeIds?.[index] ?? "").trim()
    if (textNodeId) return textNodeId
  }
  return ""
}

function 获取线条DML标注锚点(graph: GraphLike, lineNodeId: string): DML标注锚点 | undefined {
  const 候选锚点: Array<{ textNodeId: string; source: DML标注锚点["source"] }> = [
    {
      textNodeId: 获取线条区域标注文本节点Id(graph, lineNodeId),
      source: "region" as const,
    },
    {
      textNodeId: String(graph.底图.文本节点?.[`dml:${lineNodeId}`]?.textNodeId ?? "").trim(),
      source: "existing-dml" as const,
    },
    {
      textNodeId: 获取线条档位标注文本节点Id(graph, lineNodeId),
      source: "level" as const,
    },
  ].filter(item => item.textNodeId)

  for (const item of 候选锚点) {
    const pos = 读取文本节点位置(graph.底图.svg ?? "", item.textNodeId)
    if (pos) {
      return {
        textNodeId: item.textNodeId,
        source: item.source,
        pos,
      }
    }
  }

  return undefined
}

function 将DML标记写入高针图SVG(
  graph: 沐茵丝假发成品稿["高针指示单"]["高针图"],
  记录日志?: 调试日志函数
): 沐茵丝假发成品稿["高针指示单"]["高针图"] {
  const dmlAssignments = compileDmlAssignments(graph as unknown as GraphLike)
  const $ = load(graph.底图.svg ?? "", { xmlMode: true })
  const svgRoot = $("svg").first()
  if (svgRoot.length === 0) {
    记录日志?.("高针图DML写入SVG失败", { reason: "svg-root-missing" })
    return graph
  }

  svgRoot.attr("overflow", "visible")
  $('text[id^="dml_text_"]').remove()

  const next文本节点 = Object.fromEntries(
    Object.entries(graph.底图.文本节点 ?? {}).filter(([key]) => !String(key).startsWith("dml:"))
  ) as Record<string, 图文本节点>

  let 写入数量 = 0
  let 跳过数量 = 0
  const 字体样式 = 获取标记文本样式("dml")

  dmlAssignments.forEach((dml值, lineNodeId) => {
    const 锚点 = 获取线条DML标注锚点(graph as unknown as GraphLike, lineNodeId)
    if (!锚点) {
      跳过数量++
      记录日志?.("高针图DML写入SVG逐条明细", {
        lineNodeId,
        dml值,
        usedAnchorTextNodeId: "",
        anchorSource: "missing",
        written: false,
      })
      return
    }

    const textNodeId = `dml_text_${lineNodeId}`
    const textNode = $("<text></text>")
    textNode.attr("id", textNodeId)
    textNode.attr("x", String(锚点.pos.x))
    textNode.attr("y", String(锚点.pos.y))
    Object.entries(字体样式).forEach(([key, value]) => {
      textNode.attr(key, String(value))
    })
    textNode.text(dml值)
    svgRoot.append(textNode)

    next文本节点[`dml:${lineNodeId}`] = {
      textNodeId,
      text: dml值,
      created: true,
      fontStyle: {
        fill: 字体样式.fill,
        fontWeight: 字体样式["font-weight"],
        fontSize: 字体样式["font-size"],
        textAnchor: 字体样式["text-anchor"],
        dominantBaseline: 字体样式["dominant-baseline"],
      },
    }
    写入数量++
    记录日志?.("高针图DML写入SVG逐条明细", {
      lineNodeId,
      dml值,
      usedAnchorTextNodeId: 锚点.textNodeId,
      anchorSource: 锚点.source,
      written: true,
      x: 锚点.pos.x,
      y: 锚点.pos.y,
    })
  })

  const nextSvg = $.xml()
  记录日志?.("高针图DML写入SVG摘要", {
    assignmentCount: dmlAssignments.size,
    writtenCount: 写入数量,
    skippedCount: 跳过数量,
  })

  return {
    ...graph,
    底图: {
      ...graph.底图,
      svg: nextSvg,
      文本节点: next文本节点,
    },
  }
}

// 上下分时，把 B 图上的规则映射到 A 图的线条上。
function mapLineNodeIdsByRegionSort(
  targetGraph: GraphLike,
  sourceGraph: GraphLike,
  sourceLineIds: string[]
): string[] {
  const targetByRegion = getRegionLinesByName(targetGraph)
  const sourceLineMap = new Map(
    getRegionLines(sourceGraph).map(line => [line.lineNodeId, line] as const)
  )

  const out: string[] = []
  const seen = new Set<string>()

  uniqueLineIds(sourceLineIds).forEach(sourceLineId => {
    const sourceLine = sourceLineMap.get(sourceLineId)
    if (!sourceLine) return

    const candidates = targetByRegion.get(sourceLine.区域名) ?? []
    if (candidates.length === 0) return

    let best = candidates[0]
    let bestDistance = Math.abs(candidates[0].sort - sourceLine.sort)
    for (let i = 1; i < candidates.length; i++) {
      const distance = Math.abs(candidates[i].sort - sourceLine.sort)
      if (distance < bestDistance) {
        best = candidates[i]
        bestDistance = distance
      }
    }

    if (seen.has(best.lineNodeId)) return
    seen.add(best.lineNodeId)
    out.push(best.lineNodeId)
  })

  return out
}

function mapDmlRulesFromBToA(
  targetGraph: GraphLike,
  sourceGraph: GraphLike,
  记录日志?: 调试日志函数
): DML规则命令列表 {
  const targetRegions = getRegionSet(targetGraph)
  const mappedRules: DML规则命令[] = []

  // #region debug-point A:split-map-input-summary
  记录日志?.("上下分规则映射输入摘要", {
    sourceRuleCount: sourceGraph.自定义数据.DML规则命令列表?.length ?? 0,
    sourceRegionCount: getRegionSet(sourceGraph).size,
    targetRegionCount: targetRegions.size,
    sourceLineCount: getRegionLines(sourceGraph).length,
    targetLineCount: getRegionLines(targetGraph).length,
  })
  // #endregion

  for (const rule of sourceGraph.自定义数据.DML规则命令列表 ?? []) {
    if (!rule || rule.type === "特殊标记") continue

    const 原始线条数量 = rule.lineNodeIds.length
    const 源图可收集线条 = collectCommandLineIds(sourceGraph, rule)

    // #region debug-point B:split-map-rule-before
    记录日志?.("上下分单条规则映射前", {
      ruleId: rule.id,
      levelCount: rule.type === "按档位标记" ? rule.档位.length : undefined,
      ruleType: rule.type,
      rawLineNodeCount: 原始线条数量,
      collectedLineNodeCount: 源图可收集线条.length,
      regionPercentCount: rule.type === "区域百分比" ? rule.区域百分比.length : undefined,
    })
    // #endregion

    const lineNodeIds = mapLineNodeIdsByRegionSort(targetGraph, sourceGraph, rule.lineNodeIds)

    // #region debug-point C:split-map-rule-after
    记录日志?.("上下分单条规则映射后", {
      ruleId: rule.id,
      ruleType: rule.type,
      mappedLineNodeCount: lineNodeIds.length,
      targetMatchedRegionPercentCount:
        rule.type === "区域百分比"
          ? rule.区域百分比.filter(segment => targetRegions.has(String(segment.区域 ?? "").trim()))
              .length
          : undefined,
    })
    // #endregion

    if (lineNodeIds.length === 0) continue

    if (rule.type === "区域百分比") {
      const segments = (rule.区域百分比 ?? []).filter(segment =>
        targetRegions.has(String(segment.区域 ?? "").trim())
      )
      if (segments.length === 0) continue
      mappedRules.push({
        ...rule,
        id: createRuleId("dml_region"),
        lineNodeIds,
        区域百分比: segments,
      })
      continue
    }

    mappedRules.push({
      ...rule,
      id: createRuleId("dml_rule"),
      lineNodeIds,
    })
  }

  return [...mappedRules, ...keepSpecialRules(targetGraph.自定义数据.DML规则命令列表)]
}

function strip高针图DML标注(
  graph: 沐茵丝假发成品稿["高针指示单"]["高针图"]
): 沐茵丝假发成品稿["高针指示单"]["高针图"] {
  const 文本节点 = graph?.底图?.文本节点 ?? {}
  return {
    ...graph,
    底图: {
      ...graph.底图,
      文本节点: Object.fromEntries(
        Object.entries(文本节点).filter(([key]) => !String(key).startsWith("dml:"))
      ),
    },
    自定义数据: {
      ...graph.自定义数据,
      DML规则命令列表: [],
    },
  }
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
  const next高针图 =
    fileA.假发类型 === 假发类型.间色
      ? strip高针图DML标注(fileA.高针指示单.高针图)
      : fileA.高针指示单.高针图

  return {
    ...fileA,
    假发类型: fileB.假发类型,
    染色档位列表: 深拷贝普通对象(fileB.染色档位列表),
    制品规格书: {
      ...fileA.制品规格书,
      胶丝比例id: fileB.制品规格书.胶丝比例id,
    },
    高针指示单: {
      ...fileA.高针指示单,
      高针图: next高针图,
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
  const 高针图 = 将DML标记写入高针图SVG(
    {
      ...c稿.高针指示单.高针图,
      自定义数据: {
        ...c稿.高针指示单.高针图.自定义数据,
        DML规则命令列表: mapDmlRulesFromBToA(
          c稿.高针指示单.高针图 as unknown as GraphLike,
          b稿.高针指示单.高针图 as unknown as GraphLike,
          记录日志
        ),
      },
    },
    记录日志
  )

  const 手织图 = {
    ...c稿.手织指示单.手织图,
    自定义数据: {
      ...c稿.手织指示单.手织图.自定义数据,
      DML规则命令列表: mapDmlRulesFromBToA(
        c稿.手织指示单.手织图 as unknown as GraphLike,
        b稿.手织指示单.手织图 as unknown as GraphLike,
        记录日志
      ),
    },
  }

  // #region debug-point D:split-graph-output
  记录日志?.("生成上下分图稿结果摘要", {
    高针图规则数: 高针图.自定义数据.DML规则命令列表?.length ?? 0,
    手织图规则数: 手织图.自定义数据.DML规则命令列表?.length ?? 0,
    B稿高针图规则数: b稿.高针指示单.高针图.自定义数据.DML规则命令列表?.length ?? 0,
    B稿手织图规则数: b稿.手织指示单.手织图.自定义数据.DML规则命令列表?.length ?? 0,
  })
  // #endregion

  return {
    高针指示单: {
      ...c稿.高针指示单,
      高针图,
    },
    手织指示单: {
      ...c稿.手织指示单,
      手织图,
    },
  }
}

function 按上下分图稿回算机器规格清单(
  c稿: 沐茵丝假发成品稿,
  高针图: 沐茵丝假发成品稿["高针指示单"]["高针图"]
): 沐茵丝假发成品稿["制品规格书"]["机器规格清单"] {
  return strip机器规格清单到单D尺数(c稿.制品规格书.机器规格清单).map(row => ({
    ...row,
    双针: {
      ...row.双针,
      尺数: 根据高针图计算档位尺数(高针图 as 高针图, row.档位),
    },
  }))
}

function 提取上下分标记(机器规格清单: 沐茵丝假发成品稿["制品规格书"]["机器规格清单"]): {
  hasM: boolean
  hasL: boolean
} {
  return {
    hasM: 机器规格清单.some(row => row.双针.尺数.M != null),
    hasL: 机器规格清单.some(row => row.双针.尺数.L != null),
  }
}

// 用高针图上的 DML 和单双，回算上下分每档的尺数。
function 根据高针图计算档位尺数(
  graph: 高针图,
  slotName: string
): { D: number; M?: number; L?: number } {
  const dmlMap = compileDmlAssignments(graph as unknown as GraphLike)
  const lineMap = new Map(
    getRegionLines(graph as unknown as GraphLike).map(line => [line.lineNodeId, line] as const)
  )
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
      if (!line) return

      const value = dmlMap.get(lineId) ?? "D"
      const length = line.lineLength * (doubleSet.has(lineId) ? 2 : 1)
      if (value === "M") totals.M += length
      else if (value === "L") totals.L += length
      else totals.D += length
    })

  return {
    D: totals.D,
    ...(totals.M > 0 ? { M: totals.M } : {}),
    ...(totals.L > 0 ? { L: totals.L } : {}),
  }
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
  const machineRows = 按上下分图稿回算机器规格清单(fileC, 图稿.高针指示单.高针图)
  const splitFlags = 提取上下分标记(machineRows)

  // #region debug-point D:split-generate-summary
  记录日志?.("上下分生成摘要", {
    machineRowCount: machineRows.length,
    splitHasM: splitFlags.hasM,
    splitHasL: splitFlags.hasL,
    高针图规则数: 图稿.高针指示单.高针图.自定义数据.DML规则命令列表?.length ?? 0,
    手织图规则数: 图稿.手织指示单.手织图.自定义数据.DML规则命令列表?.length ?? 0,
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
