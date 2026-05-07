import type { 高针图 } from "../../../shared/models/高针图"
import type { 手织图, 手织图比例项, 手织图比值 } from "../../../shared/models/手织图"

function normalizeDmlValue(raw: unknown): 高针图["车线"][number]["DML"] {
  const v = String(raw ?? "")
    .trim()
    .toUpperCase()
  return v === "D" || v === "M" || v === "L" ? v : undefined
}

function clamp01(raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number(raw)
  if (!Number.isFinite(n)) return 0
  const normalized = Math.abs(n) > 1 ? n / 100 : n
  return Math.max(0, Math.min(1, normalized))
}

function normalize标注NodeId(raw: unknown): 高针图["车线"][number]["标注NodeId"] {
  const item = (raw ?? {}) as {
    车线编号?: unknown
    档位?: unknown
    单双?: unknown
    DML?: unknown
  }
  return {
    车线编号: String(item.车线编号 ?? "").trim() || undefined,
    档位: String(item.档位 ?? "").trim() || undefined,
    单双: String(item.单双 ?? "").trim() || undefined,
    DML: String(item.DML ?? "").trim() || undefined,
  }
}

function normalize车线(raw: unknown): 高针图["车线"] {
  const items = Array.isArray(raw) ? raw : []
  return items
    .map(rawItem => {
      const item = (rawItem ?? {}) as {
        id?: unknown
        编号?: unknown
        区域?: unknown
        车线编号?: unknown
        尺数?: unknown
        档位?: unknown
        DML?: unknown
        是双数?: unknown
        标注NodeId?: unknown
      }
      const 尺数 = typeof item.尺数 === "number" ? item.尺数 : Number(item.尺数 ?? 0)
      const legacy编号 =
        typeof item.编号 === "number" && Number.isFinite(item.编号) ? String(item.编号) : ""
      const 车线编号 = String(item.车线编号 ?? legacy编号).trim()
      return {
        id: String(item.id ?? "").trim(),
        区域: String(item.区域 ?? "").trim(),
        车线编号,
        尺数: Number.isFinite(尺数) ? 尺数 : 0,
        档位: String(item.档位 ?? "").trim(),
        DML: normalizeDmlValue(item.DML),
        是双数: typeof item.是双数 === "boolean" ? item.是双数 : undefined,
        标注NodeId: normalize标注NodeId(item.标注NodeId),
      }
    })
    .filter(item => item.id)
}

function normalize标注样式(raw: unknown): 高针图["标注样式"] {
  const src = (raw ?? {}) as Record<string, unknown>
  const out: any = {}
  const keys = ["车线编号", "档位", "单双", "DML"] as const
  for (const key of keys) {
    const item = (src as any)[key] as any
    if (!item || typeof item !== "object") continue
    const 字号 = typeof item.字号 === "number" ? item.字号 : Number(item.字号 ?? 0)
    out[key] = {
      字体: typeof item.字体 === "string" ? item.字体 : "",
      字号: Number.isFinite(字号) ? 字号 : 0,
      字色: typeof item.字色 === "string" ? item.字色 : "",
      有边框:
        item.有边框 && typeof item.有边框 === "object"
          ? {
              边框形状: item.有边框.边框形状 === "圆形" ? "圆形" : "方形",
              边框颜色: typeof item.有边框.边框颜色 === "string" ? item.有边框.边框颜色 : "",
              背景颜色: typeof item.有边框.背景颜色 === "string" ? item.有边框.背景颜色 : "",
              是否透明: Boolean(item.有边框.是否透明),
            }
          : undefined,
    }
  }
  return out
}

function normalize自动修改器(raw: unknown): 高针图["自动修改器"] {
  const items = Array.isArray(raw) ? raw : []
  const out: 高针图["自动修改器"] = []

  items.forEach(rawItem => {
    const item = (rawItem ?? {}) as Record<string, unknown>
    const type = String(item.type ?? "").trim()
    const 规律 = Array.isArray(item.规律)
      ? item.规律.map(x => String(x ?? "").trim()).filter(Boolean)
      : []

    if (typeof item.id !== "string" || !item.id.trim()) return
    const base = { 规律, id: item.id.trim() }

    if (type === "按区域自动标注DML") {
      const 范围 = Array.isArray(item.范围)
        ? item.范围
            .map(r => ({
              区域: String((r as any)?.区域 ?? "").trim(),
              开始: clamp01((r as any)?.开始),
              结束: clamp01((r as any)?.结束),
            }))
            .filter(r => r.区域)
        : []
      out.push({ type: "按区域自动标注DML", ...base, 范围 })
      return
    }

    if (type === "按档位自动标注DML") {
      const 范围 = Array.isArray(item.范围)
        ? item.范围
            .map(r => ({
              档位: String((r as any)?.档位 ?? "").trim(),
              开始: clamp01((r as any)?.开始),
              结束: clamp01((r as any)?.结束),
            }))
            .filter(r => r.档位)
        : []
      out.push({ type: "按档位自动标注DML", ...base, 范围 })
    }
  })

  return out
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
  return {
    json: typeof (raw as any)?.json === "string" ? (raw as any).json : "",
    车线: normalize车线((raw as any)?.车线),
    标注样式: normalize标注样式((raw as any)?.标注样式),
    自动修改器: normalize自动修改器((raw as any)?.自动修改器),
  }
}

export function normalize手织图(raw: unknown): 手织图 {
  const src = (raw ?? {}) as any
  const json = typeof src?.json === "string" ? src.json : ""
  const raw间色比例 = (src?.间色比例 ?? src?.类型 ?? {}) as {
    type?: unknown
    比值?: unknown
    边长?: unknown
  }

  if (raw间色比例.type === "横排") {
    return {
      json,
      间色比例: {
        type: "横排",
        比值: normalize手织图比值(raw间色比例.比值),
      },
    }
  }

  if (raw间色比例.type === "方形") {
    return {
      json,
      间色比例: {
        type: "方形",
        比值: normalize手织图比值(raw间色比例.比值),
        边长:
          typeof raw间色比例.边长 === "number" &&
          Number.isFinite(raw间色比例.边长) &&
          raw间色比例.边长 > 0
            ? raw间色比例.边长
            : 1,
      },
    }
  }

  return {
    json,
    间色比例: { type: "特殊" },
  }
}
