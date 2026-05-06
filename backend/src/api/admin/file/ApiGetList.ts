import { ApiCall } from "tsrpc"
import { z } from "zod"
import { ObjectId, type Filter, type Sort } from "mongodb"
import { ReqGetList, ResGetList } from "../../../shared/protocols/admin/file/PtlGetList"
import { Global } from "../../../models/Global"
import { 假发类型, type 沐茵丝假发成品稿 } from "../../../shared/db/Db沐茵丝假发成品稿"
import type { DML规则命令 } from "../../../shared/models/DML规则"

function normalizeLevelName(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .replace(/档$/u, "")
    .trim()
}

function formatRatioKey(ratio: { D: number; M?: number; L?: number } | undefined): string {
  if (!ratio) return ""
  const parts: string[] = []
  if (ratio.D != null) parts.push(`D:${ratio.D}`)
  if (ratio.M != null) parts.push(`M:${ratio.M}`)
  if (ratio.L != null) parts.push(`L:${ratio.L}`)
  return parts.join(":")
}

function formatRatioText(ratio: { D: number; M?: number; L?: number } | undefined): string {
  if (!ratio) return ""
  if (ratio.M != null && ratio.L != null) return `D:M:L=${ratio.D}:${ratio.M}:${ratio.L}`
  if (ratio.M != null) return `D:M=${ratio.D}:${ratio.M}`
  if (ratio.L != null) return `D:L=${ratio.D}:${ratio.L}`
  return `D=${ratio.D}`
}

function mergeLevels(levels: string[]): string {
  const nums = levels
    .map(s => normalizeLevelName(s))
    .map(s => Number(s))
    .filter(n => Number.isFinite(n))
    .sort((a, b) => a - b)
  if (nums.length === 0) {
    // fallback: keep non-numeric labels in input order
    const uniq = Array.from(new Set(levels.map(s => normalizeLevelName(s)).filter(Boolean)))
    return uniq.join(",")
  }
  const out: string[] = []
  let start = nums[0]
  let prev = nums[0]
  for (let i = 1; i < nums.length; i++) {
    const cur = nums[i]
    if (cur === prev + 1) {
      prev = cur
      continue
    }
    out.push(start === prev ? `${start}` : `${start}-${prev}`)
    start = cur
    prev = cur
  }
  out.push(start === prev ? `${start}` : `${start}-${prev}`)
  return out.join(",")
}

function build间色摘要(
  rows: Array<{ 档位?: unknown; DML比值?: { D: number; M?: number; L?: number } }>
): string[] {
  const groups = new Map<string, { ratioText: string; levels: string[] }>()
  rows.forEach(row => {
    const level = normalizeLevelName(row.档位)
    const key = formatRatioKey(row.DML比值)
    if (!level || !key) return
    const ratioText = formatRatioText(row.DML比值)
    const g = groups.get(key) ?? { ratioText, levels: [] }
    g.levels.push(level)
    groups.set(key, g)
  })
  const items = Array.from(groups.values()).filter(g => g.levels.length > 0)
  // stable display: sort by first level number if possible
  items.sort((a, b) => {
    const aN = Number(normalizeLevelName(a.levels[0]))
    const bN = Number(normalizeLevelName(b.levels[0]))
    if (Number.isFinite(aN) && Number.isFinite(bN)) return aN - bN
    return a.levels[0].localeCompare(b.levels[0])
  })
  return items.map(g => `${mergeLevels(g.levels)}档: ${g.ratioText}`)
}

function formatPercent(n: number): string {
  if (!Number.isFinite(n)) return "0%"
  return `${Math.round(n * 100)}%`
}

function build上下分摘要(commands: DML规则命令[] | undefined): string[] {
  type Group = {
    pattern: string
    startPct: string
    endPct: string
    levels: string[]
  }

  const groups = new Map<string, Group>()
  ;(commands ?? []).forEach(cmd => {
    if (!cmd || (cmd as any).type !== "按档位标记") return
    const c = cmd as Extract<DML规则命令, { type: "按档位标记" }>
    const pattern = String(c.规律 ?? "")
      .trim()
      .toUpperCase()
    if (!pattern) return
    ;(c.档位 ?? []).forEach(seg => {
      const level = normalizeLevelName(seg.档位名称)
      if (!level) return
      const startPct = formatPercent(seg.开始位置)
      const endPct = formatPercent(seg.结束位置)
      const key = `${pattern}|${startPct}|${endPct}`
      const g = groups.get(key) ?? { pattern, startPct, endPct, levels: [] }
      g.levels.push(level)
      groups.set(key, g)
    })
  })

  const items = Array.from(groups.values()).filter(g => g.levels.length > 0)
  items.sort((a, b) => {
    const aN = Number(normalizeLevelName(a.levels[0]))
    const bN = Number(normalizeLevelName(b.levels[0]))
    if (Number.isFinite(aN) && Number.isFinite(bN)) return aN - bN
    return a.levels[0].localeCompare(b.levels[0])
  })

  return items.map(g => `${mergeLevels(g.levels)}档${g.startPct}-${g.endPct}: ${g.pattern}`)
}

const ReqSchema = z.object({
  omitIdList: z.array(z.string()).optional().default([]),
  pageNum: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).default(20),
  keyword: z.string().optional(),
  orderSort: z.enum(["asc", "desc"]).default("desc"),
  filter: z
    .object({
      客户编号: z.string().optional(),
      品名: z.string().optional(),
      原材料: z.string().optional(),
      假发类型: z.nativeEnum(假发类型).optional(),
      CAP: z.string().optional(),
      tag: z.enum(["成品稿", "草稿"]).optional(),
    })
    .default({}),
})

export default async function (call: ApiCall<ReqGetList, ResGetList>) {
  const parsed = ReqSchema.safeParse(call.req)
  if (!parsed.success) {
    call.error("参数错误: " + parsed.error.message)
    return
  }

  const { omitIdList, pageNum, pageSize, keyword, orderSort, filter } = parsed.data
  const col = Global.getCollection("沐茵丝假发成品稿")

  const mongoFilter: Filter<沐茵丝假发成品稿> = {}
  const omitObjectIdList = omitIdList.filter(id => ObjectId.isValid(id)).map(id => new ObjectId(id))
  if (omitObjectIdList.length > 0) {
    mongoFilter._id = { $nin: omitObjectIdList } as Filter<沐茵丝假发成品稿>["_id"]
  }
  if (filter.客户编号) mongoFilter.客户编号 = filter.客户编号
  if (filter.品名) mongoFilter.品名 = filter.品名
  if (filter.原材料) mongoFilter.原材料 = filter.原材料
  if (filter.假发类型) mongoFilter.假发类型 = filter.假发类型
  if (filter.CAP) mongoFilter.CAP = filter.CAP
  if (filter.tag) mongoFilter.tag = filter.tag

  const kw = keyword?.trim()
  if (kw) {
    mongoFilter.$or = [
      { 样品编号: { $regex: kw, $options: "i" } },
      { 客户编号: { $regex: kw, $options: "i" } },
      { 品名: { $regex: kw, $options: "i" } },
      { 原材料: { $regex: kw, $options: "i" } },
      { CAP: { $regex: kw, $options: "i" } },
    ]
  }

  const sort: Sort = { _id: orderSort === "asc" ? 1 : -1 }

  const [total, list] = await Promise.all([
    col.countDocuments(mongoFilter),
    col
      .find(mongoFilter, {
        projection: {
          _id: 1,
          样品编号: 1,
          文件名称: 1,
          客户编号: 1,
          品名: 1,
          原材料: 1,
          假发类型: 1,
          CAP: 1,
          tag: 1,
          "制品规格书.机器规格清单.档位": 1,
          "制品规格书.机器规格清单.DML比值": 1,
          "高针指示单.高针图.自定义数据.DML规则命令列表": 1,
          "制品规格书.胶丝比例id": 1,
        },
      })
      .sort(sort)
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .toArray(),
  ])

  call.succ({
    list: list.map(doc => ({
      _id: doc._id.toHexString(),
      样品编号: doc.样品编号,
      文件名称: doc.文件名称,
      客户编号: doc.客户编号,
      品名: doc.品名,
      原材料: doc.原材料,
      假发类型: doc.假发类型,
      CAP: doc.CAP,
      tag: doc.tag ?? "成品稿",
      规则摘要:
        doc.假发类型 === "上下分"
          ? build上下分摘要(doc.高针指示单?.高针图?.自定义数据?.DML规则命令列表 as any)
          : doc.假发类型 === "间色" || doc.假发类型 === "T色"
            ? build间色摘要((doc.制品规格书?.机器规格清单 ?? []) as any)
            : undefined,
      颜色编号: doc.制品规格书?.胶丝比例id?.颜色编号,
      发丝种类: doc.制品规格书?.胶丝比例id?.发丝种类,
    })),
    total,
    pageNum,
    pageSize,
  })
}
