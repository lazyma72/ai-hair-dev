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
import type { DML规则命令, DML规则命令列表 } from "../../../shared/models/DML规则"
import {
  recalc人工规格清单D重量,
  recalc人工规格清单上下分重量,
  recalc人工规格清单按比例DML重量,
  recalc机器规格清单D重量,
  recalc机器规格清单上下分重量,
  recalc机器规格清单按比例DML重量,
} from "../../../shared/models/重量计算"
import { Logger } from "tsrpc"
import { ObjectId } from "mongodb"
type GraphLike = {
  底图: {
    区域名: string[]
    区域线条: {
      区域名: string
      lineNodeIds: string[]
      区域内位置占比: number
    }[]
    档位标注: {
      区域名: string
      lineNodeIds: string[]
    }[]
  }
  自定义数据: {
    DML规则命令列表: DML规则命令列表
  }
}

/**
 * 生成 DML 规则命令的临时 id。
 * - 仅用于服务端生成文件 C 的过程中保证“本次生成内”命令 id 唯一
 * - 不要求全局唯一，也不依赖数据库
 */
function genRuleId(prefix: string): string {
  // Local-only uniqueness is enough; keep it ASCII for safety.
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

/**
 * 判断命令是否为“特殊标记”。
 * - 特殊标记属于人工精修覆盖项，通常需要保留并作为最终覆盖
 */
function isSpecialDMLCommand(cmd: DML规则命令): boolean {
  return (cmd as any)?.type === "特殊标记"
}

/**
 * 仅保留 DML 规则中的“特殊标记”命令。
 * - 用于实现“重规律来自 B，但 A 的特殊精修仍作为最终覆盖”的语义
 */
function keepOnlySpecial(rule: DML规则命令列表 | undefined): DML规则命令列表 {
  return (rule ?? []).filter(isSpecialDMLCommand)
}

/**
 * 构建图中所有区域名集合。
 * - 同时读取 底图.区域名 和 底图.区域线条[].区域名，确保兼容不一致数据
 */
function buildRegionSet(graph: GraphLike): Set<string> {
  const s = new Set<string>()
  for (const name of graph.底图.区域名 ?? []) s.add(name)
  for (const row of graph.底图.区域线条 ?? []) s.add(row.区域名)
  return s
}

/**
 * 构建 lineNodeId -> {区域名, 区域内位置占比} 的索引表。
 * - 主要用于把任意线条 nodeId 反推到所属区域及相对位置
 * - 若存在重复 nodeId，仅保留第一次出现的记录（保持稳定性）
 */
function buildNodeIdToLineInfo(
  graph: GraphLike
): Map<string, { 区域名: string; 区域内位置占比: number }> {
  const m = new Map<string, { 区域名: string; 区域内位置占比: number }>()
  for (const line of graph.底图.区域线条 ?? []) {
    for (const nodeId of line.lineNodeIds ?? []) {
      // Keep the first hit if duplicated.
      if (!m.has(nodeId)) {
        m.set(nodeId, { 区域名: line.区域名, 区域内位置占比: line.区域内位置占比 })
      }
    }
  }
  return m
}

/**
 * 按区域分组，并按“区域内位置占比”排序每个区域的线条列表。
 * - 用于后续“按位置最近”把 B 的线条映射到 A 的线条
 */
function buildRegionLinesSorted(
  graph: GraphLike
): Map<string, { 区域内位置占比: number; lineNodeIds: string[] }[]> {
  const m = new Map<string, { 区域内位置占比: number; lineNodeIds: string[] }[]>()
  for (const line of graph.底图.区域线条 ?? []) {
    const arr = m.get(line.区域名) ?? []
    arr.push({ 区域内位置占比: line.区域内位置占比, lineNodeIds: line.lineNodeIds ?? [] })
    m.set(line.区域名, arr)
  }
  for (const [region, arr] of m.entries()) {
    arr.sort((a, b) => a.区域内位置占比 - b.区域内位置占比)
    m.set(region, arr)
  }
  return m
}

/**
 * 将 B 的一组 lineNodeIds 映射到 A 的一组 lineNodeIds。
 * 映射规则：
 * - 先用 B 的 nodeId 反推其 {区域名, 区域内位置占比}
 * - 若 A 不存在对应区域，则跳过该 nodeId
 * - 在 A 的同区域线条中，选择“区域内位置占比最接近”的线条，取其全部 nodeId 作为映射结果
 *
 * 说明：
 * - 该函数是通用映射器，不依赖具体业务（DML/染色等），只依赖区域与线条位置数据
 */
function mapLineNodeIdsByRegionPosition(
  aGraph: GraphLike,
  bGraph: GraphLike,
  bLineNodeIds: string[]
): string[] {
  const overlapRegions = buildRegionSet(aGraph)
  const bNodeToInfo = buildNodeIdToLineInfo(bGraph)
  const aRegionLines = buildRegionLinesSorted(aGraph)

  const out = new Set<string>()
  for (const bNodeId of bLineNodeIds ?? []) {
    const bInfo = bNodeToInfo.get(bNodeId)
    if (!bInfo) continue
    if (!overlapRegions.has(bInfo.区域名)) continue

    const candidates = aRegionLines.get(bInfo.区域名)
    if (!candidates || candidates.length === 0) continue

    // Find the closest line by region-relative position.
    let best = candidates[0]
    let bestDist = Math.abs(candidates[0].区域内位置占比 - bInfo.区域内位置占比)
    for (let i = 1; i < candidates.length; i++) {
      const dist = Math.abs(candidates[i].区域内位置占比 - bInfo.区域内位置占比)
      if (dist < bestDist) {
        bestDist = dist
        best = candidates[i]
      }
    }

    // Store all node ids for that line (a line can be composed of multiple SVG nodes).
    for (const aNodeId of best.lineNodeIds) out.add(aNodeId)
  }
  return Array.from(out)
}

/**
 * 将 B 图上的 DML 规则迁移到 A 图上。
 * - 仅迁移“重规律”命令（区域百分比/按档位标记等），跳过 B 的“特殊标记”
 * - 命令中的 lineNodeIds 会通过 mapLineNodeIdsByRegionPosition 映射到 A 的 nodeId
 * - 对于“区域百分比”命令，还会过滤掉 A 不存在的区域片段（区域不一致则跳过该命令）
 * - A 原有的“特殊标记”命令保留，并放在最后作为最终覆盖项
 */
function mapDMLRuleFromBToA(aGraph: GraphLike, bGraph: GraphLike): DML规则命令列表 {
  const aSpecial = keepOnlySpecial(aGraph.自定义数据.DML规则命令列表)
  const aRegions = buildRegionSet(aGraph)

  const mappedFromB: DML规则命令[] = []
  for (const cmd of bGraph.自定义数据.DML规则命令列表 ?? []) {
    if (isSpecialDMLCommand(cmd)) continue

    const mappedLineNodeIds = mapLineNodeIdsByRegionPosition(
      aGraph,
      bGraph,
      (cmd as any).lineNodeIds ?? []
    )
    if (mappedLineNodeIds.length === 0) continue

    if ((cmd as any).type === "区域百分比") {
      const rawSegments = Array.isArray((cmd as any).区域百分比) ? (cmd as any).区域百分比 : []
      const filteredSegments = rawSegments.filter(
        (seg: any) => typeof seg?.区域 === "string" && aRegions.has(seg.区域)
      )
      if (filteredSegments.length === 0) {
        // No overlapping regions: keep A as-is for this command.
        continue
      }
      mappedFromB.push({
        ...(cmd as any),
        id: genRuleId("b_region"),
        区域百分比: filteredSegments,
        lineNodeIds: mappedLineNodeIds,
      })
      continue
    }

    // "按档位标记" or future types: keep everything else, only remap ids + lineNodeIds.
    mappedFromB.push({
      ...(cmd as any),
      id: genRuleId("b_rule"),
      lineNodeIds: mappedLineNodeIds,
    })
  }

  // Preserve A's special commands as final overrides.
  return [...mappedFromB, ...aSpecial]
}

/**
 * 规范化档位/标注名称：
 * - 去掉尾部 “档”（例如 "1档" -> "1"）
 * - 其余仅 trim
 */
function normalizeLevelName(name: string): string {
  return String(name ?? "")
    .trim()
    .replace(/档$/u, "")
    .trim()
}

/**
 * 判断档位名是否为人工档位（H 档）。
 * - 例：H1/H2/H10
 */
function isHandSlot(slot: string): boolean {
  return /^H\d+$/i.test(normalizeLevelName(slot))
}

/**
 * 按区域收集该区域的所有线条 nodeId 集合。
 * - 区域线条可能一个“线”包含多个 nodeId，这里按 nodeId 粒度统一汇总
 */
function buildRegionLineIdSet(graph: GraphLike): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>()
  for (const row of graph.底图.区域线条 ?? []) {
    const region = String(row.区域名 ?? "").trim()
    if (!region) continue
    const s = out.get(region) ?? new Set<string>()
    for (const id of row.lineNodeIds ?? []) {
      const nid = String(id ?? "").trim()
      if (nid) s.add(nid)
    }
    out.set(region, s)
  }
  return out
}

/**
 * 构建“区域 -> 主档位”的映射。
 *
 * 判定规则（按区域判断，而不是按档位判断）：
 * - 遍历每个区域，统计该区域内部线条分别命中了哪些档位
 * - 哪个档位命中的线条数最多，则该区域属于哪个档位
 * - 一个档位可以拥有多个区域，但一个区域只归属于一个“主档位”
 *
 * 这更符合业务语义：
 * - 例如 B 的 1 档可以同时包含“尾巴”和“松颈”两个区域
 * - 而不是要求“1 档在某区域内覆盖率 > 50%”才算属于该区域
 */
function buildRegionToPrimarySlotMap(graph: GraphLike): Map<string, string> {
  const regionLineIdSet = buildRegionLineIdSet(graph)
  const levelItems = (graph.底图.档位标注 ?? [])
    .map(item => ({
      slot: normalizeLevelName(item.区域名),
      lineIds: new Set((item.lineNodeIds ?? []).map(id => String(id ?? "").trim()).filter(Boolean)),
    }))
    .filter(item => item.slot && item.lineIds.size > 0)

  const out = new Map<string, string>()
  for (const [region, ids] of regionLineIdSet.entries()) {
    let bestSlot = ""
    let bestHit = 0

    for (const level of levelItems) {
      let hit = 0
      ids.forEach(id => {
        if (level.lineIds.has(id)) hit += 1
      })

      if (hit > bestHit) {
        bestHit = hit
        bestSlot = level.slot
      }
    }

    if (bestSlot && bestHit > 0) {
      out.set(region, bestSlot)
    }
  }

  return out
}

/**
 * 构建“区域 -> 档位列表”映射（同时支持机器档位与人工档位）。
 * - 机器档位来源：制品规格书.机器规格清单[].档位，对应 高针图.底图.档位标注
 * - 人工档位来源：制品规格书.人工规格清单[].档位，对应 手织图.底图.档位标注
 *
 * 映射规则：
 * - 先按区域统计“主档位”，得到 区域 -> 档位
 * - 再将结果转为 区域 -> 档位列表（当前通常只有一个主档位，为统一结构仍使用数组）
 */
function buildRegionToSlotsMapForFile(file: 沐茵丝假发成品稿): {
  machine: Map<string, string[]>
  hand: Map<string, string[]>
} {
  const machineGraph = file.高针指示单.高针图 as unknown as GraphLike
  const handGraph = file.手织指示单.手织图 as unknown as GraphLike

  const machinePrimaryMap = buildRegionToPrimarySlotMap(machineGraph)
  const regionToMachine = new Map<string, string[]>()
  for (const [region, slot] of machinePrimaryMap.entries()) {
    regionToMachine.set(region, [slot])
  }

  const handPrimaryMap = buildRegionToPrimarySlotMap(handGraph)
  const regionToHand = new Map<string, string[]>()
  for (const [region, slot] of handPrimaryMap.entries()) {
    regionToHand.set(region, [slot])
  }

  return { machine: regionToMachine, hand: regionToHand }
}

/**
 * 将“区域 -> 档位列表”反转为“档位 -> 区域列表”。
 * - 一个档位可以拥有多个区域，因此反转后 value 为数组
 */
function invertRegionToSlotsMap(regionToSlots: Map<string, string[]>): Map<string, string[]> {
  const out = new Map<string, string[]>()
  for (const [region, slots] of regionToSlots.entries()) {
    for (const slot of slots) {
      const key = normalizeLevelName(slot)
      if (!key) continue
      const arr = out.get(key) ?? []
      arr.push(region)
      out.set(key, arr)
    }
  }
  return out
}

/**
 * 替换单条染色档位记录中的“档位列表”，并保持联合类型（普通/对折/错位）正确。
 * - 只替换 染色图.档位标注.档位列表，其他字段保持不变
 */
function replaceDyeLevelSlots(item: 染色档位, slots: string[]): 染色档位 {
  const next档位标注 = {
    ...item.染色图.档位标注,
    档位列表: slots,
  }

  switch (item.type) {
    case "普通":
      return {
        type: "普通",
        染色图: {
          ...item.染色图,
          档位标注: next档位标注,
        },
      }
    case "对折":
      return {
        type: "对折",
        染色图: {
          ...item.染色图,
          档位标注: next档位标注,
        },
      }
    case "错位":
      return {
        type: "错位",
        染色图: {
          ...item.染色图,
          档位标注: next档位标注,
        },
      }
    default: {
      const _never: never = item
      return _never
    }
  }
}

/**
 * 将 B 的染色档位列表迁移到 A（最终用于 C）。
 *
 * 业务规则（通用规则：所有假发类型都适用）：
 * - 染色档位记录本体取自 B（染色图模板/尺寸/文本替换等），因为染色属于 B 的工艺信息
 * - 但档位号需要替换为“生成稿（以 A 为底）的对应区域档位”
 * - 若 B 某档位能归属到区域，并且 A 存在同区域档位，则用 A 的该区域档位列表替换
 * - 若无法映射（区域不明确或 A 不存在对应区域），则保留原档位名（不强行修改）
 *
 * 当前实现基于 手织图 做区域推断（染色档位一般是 H 档位）。
 */
function mapDyeLevelsFromBToA(
  fileA: 沐茵丝假发成品稿,
  fileB: 沐茵丝假发成品稿,
  logger: Logger
): 染色档位[] {
  const aMaps = buildRegionToSlotsMapForFile(fileA)
  const bMaps = buildRegionToSlotsMapForFile(fileB)
  const bMachineSlotToRegions = invertRegionToSlotsMap(bMaps.machine)
  const bHandSlotToRegions = invertRegionToSlotsMap(bMaps.hand)

  return fileB.染色档位列表.map(item => {
    const replacedSlots: string[] = []
    const logs: Array<{ slot: string; isHand: boolean; regions: string[]; mapped: string[] }> = []

    for (const rawSlot of item.染色图.档位标注.档位列表 ?? []) {
      const slot = normalizeLevelName(rawSlot)
      if (!slot) continue

      const isHand = isHandSlot(slot)
      const slotToRegions = isHand ? bHandSlotToRegions : bMachineSlotToRegions
      const regionToSlots = isHand ? aMaps.hand : aMaps.machine
      const regions = slotToRegions.get(slot) ?? []

      const mapped = regions.flatMap(region => regionToSlots.get(region) ?? [])
      if (mapped.length > 0) replacedSlots.push(...mapped)
      else replacedSlots.push(slot)

      logs.push({ slot, isHand, regions, mapped })
    }

    const uniqueReplaced = Array.from(new Set(replacedSlots))
    const original = (item.染色图.档位标注.档位列表 ?? []).map(normalizeLevelName).filter(Boolean)
    logger.log(
      "[GenerateByAB][DyeLevelMap]",
      JSON.stringify({
        fileAId: fileA._id,
        fileBId: fileB._id,
        dyeType: item.type,
        originalSlots: original,
        replacedSlots: uniqueReplaced,
        aMapsMachine: Object.fromEntries(
          Array.from(aMaps.machine.entries()).map(([region, slots]) => [region, [...slots]])
        ),
        bMapsMachine: Object.fromEntries(
          Array.from(bMaps.machine.entries()).map(([region, slots]) => [region, [...slots]])
        ),
        details: logs,
      })
    )

    return replaceDyeLevelSlots(item, uniqueReplaced)
  })
}

/**
 * 构建 C 的基础稿：基础沿用 A，但把 B 的“通用关联信息”合并进来。
 * - 胶丝比例沿用 B（避免颜色/比例不一致）
 * - 染色档位列表：以 B 为来源，但档位号按区域映射替换（通用规则，对所有假发类型生效）
 */
function buildBaseFileC(
  fileA: 沐茵丝假发成品稿,
  fileB: 沐茵丝假发成品稿,
  logger: Logger
): 沐茵丝假发成品稿 {
  // 通用规则：基础沿用 A，胶丝比例沿用 B
  return {
    ...fileA,
    染色档位列表: mapDyeLevelsFromBToA(fileA, fileB, logger),
    制品规格书: {
      ...fileA.制品规格书,
      胶丝比例id: fileB.制品规格书.胶丝比例id,
    },
  }
}

/**
 * B=纯色：C 以 A 为基础，并重新计算 D 重量（机器/人工）。
 * - 胶丝比例/染色档位等通用字段由 buildBaseFileC 处理
 */
function applyRulesByBColor(
  fileA: 沐茵丝假发成品稿,
  fileB: 沐茵丝假发成品稿,
  logger: Logger
): 沐茵丝假发成品稿 {
  const fileC = buildBaseFileC(fileA, fileB, logger)
  return {
    ...fileC,
    制品规格书: {
      ...fileC.制品规格书,
      机器规格清单: recalc机器规格清单D重量(fileC.制品规格书.机器规格清单),
      人工规格清单: recalc人工规格清单D重量(fileC.制品规格书.人工规格清单),
    },
  }
}

/**
 * 从 B 中提取“间色”需要的 D/M/L 比值。
 * - 优先取机器规格清单中第一个存在 DML比值 的档位记录
 * - 若不存在则兜底 {D:1, L:1}
 */
function pickB间色比值(fileB: 沐茵丝假发成品稿): { D: number; M?: number; L?: number } {
  const fromMachine = fileB.制品规格书.机器规格清单.find(row => row.DML比值 != null)?.DML比值
  if (fromMachine) {
    return {
      D: fromMachine.D,
      M: fromMachine.M,
      L: fromMachine.L,
    }
  }
  return { D: 1, L: 1 }
}

/**
 * 提取 B 的“上下分标记”。
 * - 通过机器规格清单是否存在 M/L 尺数来判断 C 是否需要计算 M/L 重量
 */
function pickB上下分标记(fileB: 沐茵丝假发成品稿): { hasM: boolean; hasL: boolean } {
  const hasM = fileB.制品规格书.机器规格清单.some(row => row.双针.尺数.M != null)
  const hasL = fileB.制品规格书.机器规格清单.some(row => row.双针.尺数.L != null)
  return { hasM, hasL }
}

/**
 * B=间色：C 以 A 为基础，按 B 的 D/M/L 比值重算 DML 重量（机器/人工）。
 * - DML 比值写入机器规格清单的 DML比值 字段
 */
function applyRulesByBHighlight(
  fileA: 沐茵丝假发成品稿,
  fileB: 沐茵丝假发成品稿,
  logger: Logger
): 沐茵丝假发成品稿 {
  const fileC = buildBaseFileC(fileA, fileB, logger)
  const ratio = pickB间色比值(fileB)
  return {
    ...fileC,
    制品规格书: {
      ...fileC.制品规格书,
      机器规格清单: recalc机器规格清单按比例DML重量(fileC.制品规格书.机器规格清单, ratio),
      人工规格清单: recalc人工规格清单按比例DML重量(fileC.制品规格书.人工规格清单, ratio),
    },
  }
}

/**
 * B=上下分：C 以 A 为基础，按 B 的上下分标记重算重量，并迁移图纸 DML 规律。
 * - 重量：使用 recalc*上下分重量 计算 D/M/L 重量
 * - 图纸：高针/手织图以 A 为底，但把 B 的“重规律”DML 规则映射过来
 * - DML 规则迁移策略：见 mapDMLRuleFromBToA 注释
 */
function applyRulesByBSplit(
  fileA: 沐茵丝假发成品稿,
  fileB: 沐茵丝假发成品稿,
  logger: Logger
): 沐茵丝假发成品稿 {
  const fileC = buildBaseFileC(fileA, fileB, logger)
  const splitFlags = pickB上下分标记(fileB)
  // 上下分：图纸以 A 为底，但把 B 的（非特殊）DML 规律迁移到 A 的图上。
  // 规则：
  // - 迁移只处理重规律（区域百分比/按档位标记等），跳过 "特殊标记"
  // - 如果区域名称不重叠，则该条规律跳过（不替换不修改）
  // - A 原有的 "特殊标记" 保留并作为最终覆盖项
  return {
    ...fileC,
    制品规格书: {
      ...fileC.制品规格书,
      机器规格清单: recalc机器规格清单上下分重量(fileC.制品规格书.机器规格清单, splitFlags),
      人工规格清单: recalc人工规格清单上下分重量(fileC.制品规格书.人工规格清单, splitFlags),
    },
    高针指示单: {
      ...fileC.高针指示单,
      高针图: {
        ...fileC.高针指示单.高针图,
        自定义数据: {
          ...fileC.高针指示单.高针图.自定义数据,
          DML规则命令列表: mapDMLRuleFromBToA(
            fileC.高针指示单.高针图 as unknown as GraphLike,
            fileB.高针指示单.高针图 as unknown as GraphLike
          ),
        },
      },
    },
    手织指示单: {
      ...fileC.手织指示单,
      手织图: {
        ...fileC.手织指示单.手织图,
        自定义数据: {
          ...fileC.手织指示单.手织图.自定义数据,
          DML规则命令列表: mapDMLRuleFromBToA(
            fileC.手织指示单.手织图 as unknown as GraphLike,
            fileB.手织指示单.手织图 as unknown as GraphLike
          ),
        },
      },
    },
  }
}

/**
 * GenerateByAB 主入口：
 * - 校验 A/B 不同且存在
 * - 按 B 的假发类型选择规则生成 C
 * - 返回生成的文件（前端可用于预览/编辑后再保存为新稿）
 */
export default async function (call: ApiCall<ReqGenerateByAB, ResGenerateByAB>) {
  if (call.req.fileAId === call.req.fileBId) {
    return call.error("文件A和文件B不能相同")
  }
  if (!ObjectId.isValid(call.req.fileAId) || !ObjectId.isValid(call.req.fileBId)) {
    return call.error("文件A或文件B不存在")
  }
  const [fileA, fileB] = await Promise.all([
    Global.getCollection("沐茵丝假发成品稿").findOne({ _id: new ObjectId(call.req.fileAId) }),
    Global.getCollection("沐茵丝假发成品稿").findOne({ _id: new ObjectId(call.req.fileBId) }),
  ])
  if (!fileA || !fileB) {
    return call.error("文件A或文件B不存在")
  }

  const fileC = (() => {
    switch (fileB.假发类型) {
      case 假发类型.纯色:
        return applyRulesByBColor(fileA, fileB, call.logger)
      case 假发类型.间色:
        return applyRulesByBHighlight(fileA, fileB, call.logger)
      case 假发类型.上下分:
        return applyRulesByBSplit(fileA, fileB, call.logger)
      case 假发类型.T色:
        // TODO(B=T色): 业务规则未定义，后续补充
        return buildBaseFileC(fileA, fileB, call.logger)
      default: {
        const _never: never = fileB.假发类型
        return _never
      }
    }
  })()

  call.succ({ file: fileC })
}
