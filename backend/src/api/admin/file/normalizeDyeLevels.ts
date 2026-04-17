import type { 染色档位 } from "../../../shared/db/Db沐茵丝假发成品稿"
import { 普通染色档位, 对折染色档位, 错位染色档位 } from "../../../shared/models/染色档位示例"

const 染色示例列表 = [普通染色档位, 对折染色档位, 错位染色档位] as const

function get染色示例(type: 染色档位["type"]): 染色档位 {
  return 染色示例列表.find(d => d.type === type) ?? 染色示例列表[0]
}

/**
 * 兼容旧数据：补齐 染色档位 里协议要求的 textNodeId 等字段。
 * - 只在字段缺失时用模板默认值补齐，不覆盖已有值。
 * - 目标是避免 GetDetail 因缺字段直接返回 INTERNAL_ERR。
 */
export function normalize染色档位(item: unknown): 染色档位 {
  const anyItem = (item ?? {}) as any
  const type: 染色档位["type"] =
    anyItem.type === "普通" || anyItem.type === "对折" || anyItem.type === "错位"
      ? anyItem.type
      : "普通"

  const tpl = structuredClone(get染色示例(type)) as any
  const src染色图 = anyItem.染色图 ?? {}

  const out: any = {
    ...anyItem,
    type,
    染色图: {
      ...src染色图,
      // svg 缺失时用模板兜底（避免后续预览渲染崩）
      svg: typeof src染色图.svg === "string" ? src染色图.svg : tpl.染色图.svg,
      档位标注: {
        ...tpl.染色图.档位标注,
        ...(src染色图.档位标注 ?? {}),
        档位列表: Array.isArray(src染色图.档位标注?.档位列表)
          ? src染色图.档位标注.档位列表
          : tpl.染色图.档位标注.档位列表,
      },
      染色尺寸标注: {
        ...tpl.染色图.染色尺寸标注,
        ...(src染色图.染色尺寸标注 ?? {}),
      },
      文本替换:
        src染色图.文本替换 && typeof src染色图.文本替换 === "object"
          ? src染色图.文本替换
          : tpl.染色图.文本替换,
    },
  }

  if (type === "错位") {
    out.染色图.长尺寸标注 = {
      ...tpl.染色图.长尺寸标注,
      ...(src染色图.长尺寸标注 ?? {}),
    }
    if (src染色图.短尺寸标注 != null || tpl.染色图.短尺寸标注 != null) {
      out.染色图.短尺寸标注 = {
        ...tpl.染色图.短尺寸标注,
        ...(src染色图.短尺寸标注 ?? {}),
      }
    }
  } else {
    delete out.染色图.长尺寸标注
    delete out.染色图.短尺寸标注
  }

  return out as 染色档位
}

export function normalize染色档位列表(list: unknown): 染色档位[] {
  if (!Array.isArray(list)) return []
  return list.map(normalize染色档位)
}

