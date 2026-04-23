import { 空DML规则命令列表, type DML规则命令列表 } from "../../../shared/models/DML规则"
import type { 高针图 } from "../../../shared/models/高针图"
import type { 手织图 } from "../../../shared/models/手织图"

function normalize高针区域线条(raw: unknown): 高针图["底图"]["区域线条"] {
  const items = Array.isArray(raw) ? raw : []
  return items
    .map((rawItem, itemIndex) => {
      const item = (rawItem ?? {}) as {
        区域名?: unknown
        lineNodeId?: unknown
        lineLength?: unknown
        区域内位置占比?: unknown
        sort?: unknown
      }
      const 区域名 = String(item.区域名 ?? "").trim()
      const lineLength = typeof item.lineLength === "number" ? item.lineLength : 0
      const ratio =
        typeof item.区域内位置占比 === "number"
          ? item.区域内位置占比
          : Number(item.区域内位置占比 ?? 0)
      const 区域内位置占比 = Number.isFinite(ratio) ? ratio : 0
      const explicitLineNodeId = String(item.lineNodeId ?? "").trim()
      const explicitSort =
        typeof item.sort === "number" && Number.isFinite(item.sort) && item.sort > 0
          ? Math.floor(item.sort)
          : null

      return {
        区域名,
        lineNodeId: explicitLineNodeId,
        lineLength,
        区域内位置占比,
        sort: explicitSort ?? itemIndex + 1,
      }
    })
    .filter(item => item.lineNodeId)
    .map((item, index) => ({
      item,
      sort:
        typeof item.sort === "number" && Number.isFinite(item.sort) && item.sort > 0
          ? item.sort
          : index + 1,
      index,
    }))
    .sort((left, right) => left.sort - right.sort || left.index - right.index)
    .map(({ item }, index) => ({
      ...item,
      sort: index + 1,
    }))
}

function normalize高针底图(raw: any): 高针图["底图"] {
  return {
    svg: typeof raw?.svg === "string" ? raw.svg : "",
    区域名: Array.isArray(raw?.区域名) ? raw.区域名 : [],
    区域线条: normalize高针区域线条(raw?.区域线条),
    档位标注: Array.isArray(raw?.档位标注) ? raw.档位标注 : [],
    文本节点: raw?.文本节点 && typeof raw.文本节点 === "object" ? raw.文本节点 : {},
  }
}

function normalize手织底图(raw: any): 手织图["底图"] {
  return {
    svg: typeof raw?.svg === "string" ? raw.svg : "",
    区域名: Array.isArray(raw?.区域名) ? raw.区域名 : [],
    区域线条: Array.isArray(raw?.区域线条) ? raw.区域线条 : [],
    档位标注: Array.isArray(raw?.档位标注) ? raw.档位标注 : [],
    文本节点: raw?.文本节点 && typeof raw.文本节点 === "object" ? raw.文本节点 : {},
  }
}

export function normalize高针图(raw: unknown): 高针图 {
  const src = (raw ?? {}) as any
  const rawDml = src?.自定义数据?.DML规则命令列表 ?? src?.自定义数据?.DML规则?.命令列表
  const dmlCommands: DML规则命令列表 = Array.isArray(rawDml) ? rawDml : 空DML规则命令列表()
  return {
    底图: normalize高针底图(src.底图),
    自定义数据: {
      DML规则命令列表: dmlCommands,
      单双标注: Array.isArray(src?.自定义数据?.单双标注) ? src.自定义数据.单双标注 : [],
    },
  }
}

export function normalize手织图(raw: unknown): 手织图 {
  const src = (raw ?? {}) as any
  const rawDml = src?.自定义数据?.DML规则命令列表 ?? src?.自定义数据?.DML规则?.命令列表
  const dmlCommands: DML规则命令列表 = Array.isArray(rawDml) ? rawDml : 空DML规则命令列表()
  return {
    底图: normalize手织底图(src.底图),
    自定义数据: {
      DML规则命令列表: dmlCommands,
    },
  }
}
