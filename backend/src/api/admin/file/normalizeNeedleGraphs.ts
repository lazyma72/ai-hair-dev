import { 空DML规则命令列表, type DML规则命令列表 } from "../../../shared/models/DML规则"
import type { 高针图 } from "../../../shared/models/高针图"
import type { 手织图, 手织图比例项, 手织图比值 } from "../../../shared/models/手织图"

function normalize高针区域线条(raw: unknown): 高针图["底图"]["区域线条"] {
  const items = Array.isArray(raw) ? raw : []
  return items
    .map((rawItem, itemIndex) => {
      const item = (rawItem ?? {}) as {
        区域名?: unknown
        sortNodeId?: unknown
        lineNodeId?: unknown
        lineLength?: unknown
        区域内位置占比?: unknown
        sort?: unknown
        textNodeIds?: unknown
      }
      const 区域名 = String(item.区域名 ?? "").trim()
      const sortNodeId =
        String(item.sortNodeId ?? "").trim() ||
        (Array.isArray(item.textNodeIds) ? String(item.textNodeIds[0] ?? "").trim() : "")
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
        sortNodeId,
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

function normalize手织图比例项(
  raw: unknown,
  fallbackSort: number,
  fallbackValue: number
): 手织图比例项 {
  const item = (raw ?? {}) as {
    值?: unknown
    是否染色?: unknown
    remark?: unknown
    sort?: unknown
  }
  const 值 = typeof item.值 === "number" ? item.值 : Number(item.值 ?? fallbackValue)
  const sort =
    typeof item.sort === "number" && Number.isFinite(item.sort) && item.sort > 0
      ? Math.floor(item.sort)
      : fallbackSort

  return {
    值: Number.isFinite(值) ? 值 : fallbackValue,
    是否染色: Boolean(item.是否染色),
    remark: typeof item.remark === "string" ? item.remark : "",
    sort,
  }
}

function normalize手织图比值(raw: unknown): 手织图比值 {
  const 比值 = (raw ?? {}) as {
    D?: unknown
    M?: unknown
    L?: unknown
  }

  return {
    D: normalize手织图比例项(比值.D, 1, 1),
    M: 比值.M == null ? undefined : normalize手织图比例项(比值.M, 2, 2),
    L: 比值.L == null ? undefined : normalize手织图比例项(比值.L, 3, 1),
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
  const svg = typeof src?.svg === "string" ? src.svg : ""
  const raw类型 = (src?.类型 ?? {}) as {
    type?: unknown
    groupNodeId?: unknown
    比值?: unknown
    边长?: unknown
  }

  if (raw类型.type === "横排") {
    return {
      svg,
      类型: {
        type: "横排",
        groupNodeId:
          typeof raw类型.groupNodeId === "string" && raw类型.groupNodeId.trim()
            ? raw类型.groupNodeId
            : "hand_woven_horizontal_group",
        比值: normalize手织图比值(raw类型.比值),
      },
    }
  }

  if (raw类型.type === "方形") {
    return {
      svg,
      类型: {
        type: "方形",
        groupNodeId:
          typeof raw类型.groupNodeId === "string" && raw类型.groupNodeId.trim()
            ? raw类型.groupNodeId
            : "hand_woven_square_group",
        比值: normalize手织图比值(raw类型.比值),
        边长:
          typeof raw类型.边长 === "number" && Number.isFinite(raw类型.边长) && raw类型.边长 > 0
            ? raw类型.边长
            : 1,
      },
    }
  }

  return {
    svg,
    类型: { type: "特殊" },
  }
}
