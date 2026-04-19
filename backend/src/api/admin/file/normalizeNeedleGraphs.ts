import { 空DML规则 } from "../../../shared/models/DML规则"
import type { 高针图 } from "../../../shared/models/高针图"
import type { 手织图 } from "../../../shared/models/手织图"

function normalize底图(raw: any) {
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
  return {
    底图: normalize底图(src.底图),
    自定义数据: {
      DML规则: src?.自定义数据?.DML规则 ?? 空DML规则(),
      单双标注: Array.isArray(src?.自定义数据?.单双标注) ? src.自定义数据.单双标注 : [],
    },
  }
}

export function normalize手织图(raw: unknown): 手织图 {
  const src = (raw ?? {}) as any
  return {
    底图: normalize底图(src.底图),
    自定义数据: {
      DML规则: src?.自定义数据?.DML规则 ?? 空DML规则(),
    },
  }
}
