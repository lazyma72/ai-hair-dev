import { z } from "zod"
import { 假发类型, type 沐茵丝假发成品稿 } from "../../../shared/db/Db沐茵丝假发成品稿"

const MAX_CUT_WEIGHT_ITEMS = 3
const DML_DECIMAL_SCALE = 10

function isQuarterInch(n: number): boolean {
  return Number.isFinite(n) && Math.round(n * 4) === n * 4
}

function isOneDecimal(n: number): boolean {
  return Number.isFinite(n) && Math.round(n * DML_DECIMAL_SCALE) === n * DML_DECIMAL_SCALE
}

const DMLValueSchema = z.number().refine(isOneDecimal, "DML比值最多1位小数")

const CutWeightItemSchema = z
  .object({
    裁断: z.number(),
    重量g: z
      .object({
        D: z.number(),
        M: z.number().optional(),
        L: z.number().optional(),
      })
      .optional(),
  })
  .passthrough()

const DyeItemSchema = z
  .object({
    type: z.enum(["普通", "对折", "错位"]),
    染色图: z
      .object({
        档位标注: z.object({ 档位列表: z.array(z.string()) }),
        染色尺寸标注: z.object({ 尺寸: z.number() }),
        长尺寸标注: z.object({ 尺寸: z.number() }).optional(),
        短尺寸标注: z.object({ 尺寸: z.number() }).optional(),
      })
      .passthrough(),
  })
  .passthrough()
  .superRefine((item, ctx) => {
    const normalizedSlots = Array.from(
      new Set(item.染色图.档位标注.档位列表.map(s => s.trim()).filter(Boolean))
    )

    if (normalizedSlots.length < 1) {
      ctx.addIssue({
        code: "custom",
        message: "每张染色图至少选择一个适用档位",
      })
    }

    if (!isQuarterInch(item.染色图.染色尺寸标注.尺寸)) {
      ctx.addIssue({
        code: "custom",
        message: "染色尺寸必须是 0.25 的倍数",
      })
    }

    if (item.type === "错位") {
      if (!item.染色图.长尺寸标注 || !isQuarterInch(item.染色图.长尺寸标注.尺寸)) {
        ctx.addIssue({
          code: "custom",
          message: "长尺寸必须是 0.25 的倍数",
        })
      }

      if (item.染色图.短尺寸标注 && !isQuarterInch(item.染色图.短尺寸标注.尺寸)) {
        ctx.addIssue({
          code: "custom",
          message: "短尺寸必须是 0.25 的倍数",
        })
      }
    }
  })

const FileSchema = z
  .object({
    _id: z.string().trim().min(1, "样品编号不能为空"),
    客户编号: z.string().trim().min(1, "客户编号不能为空"),
    品名: z.string().trim().min(1, "品名不能为空"),
    CAP: z.string().trim().min(1, "CAP不能为空"),
    原材料: z.string().trim().min(1, "原材料不能为空"),
    假发类型: z.nativeEnum(假发类型),
    染色档位列表: z.array(DyeItemSchema),
    高针指示单: z.object({}).passthrough(),
    手织指示单: z.object({}).passthrough(),
    头型图片: z.array(z.string()),
    制品规格书: z
      .object({
        机器规格清单: z.array(
          z
            .object({
              裁断与重量: z
                .array(CutWeightItemSchema)
                .max(MAX_CUT_WEIGHT_ITEMS, "裁断重量项最多3个"),
              DML比值: z
                .object({
                  D: DMLValueSchema,
                  M: DMLValueSchema.optional(),
                  L: DMLValueSchema.optional(),
                })
                .optional(),
            })
            .passthrough()
        ),
        人工规格清单: z.array(
          z
            .object({
              裁断与重量: z
                .array(CutWeightItemSchema)
                .max(MAX_CUT_WEIGHT_ITEMS, "裁断重量项最多3个"),
            })
            .passthrough()
        ),
      })
      .passthrough(),
  })
  .passthrough()
  .superRefine((file, ctx) => {
    const usedSlots = new Set<string>()

    for (const item of file.染色档位列表) {
      const normalized = Array.from(
        new Set(item.染色图.档位标注.档位列表.map(s => s.trim()).filter(Boolean))
      )

      for (const slot of normalized) {
        if (usedSlots.has(slot)) {
          ctx.addIssue({
            code: "custom",
            message: "一个档位最多对应一张染色图，请调整重复项",
          })
          break
        }
        usedSlots.add(slot)
      }
    }

    if (file.假发类型 !== 假发类型.间色) {
      const hasDML = file.制品规格书.机器规格清单.some(row => row.DML比值 != null)
      if (hasDML) {
        ctx.addIssue({
          code: "custom",
          message: "非间色假发的机器规格清单中不允许设置 DML比值",
        })
      }
    }
  })

export const ErrorCodeByMessage: Record<string, string> = {
  样品编号不能为空: "EMPTY_FILE_ID",
  客户编号不能为空: "EMPTY_CUSTOMER_NO",
  品名不能为空: "EMPTY_PRODUCT_NAME",
  CAP不能为空: "EMPTY_CAP",
  原材料不能为空: "EMPTY_MATERIAL",
  每张染色图至少选择一个适用档位: "INVALID_DYE_LEVEL",
  "一个档位最多对应一张染色图，请调整重复项": "DUPLICATE_DYE_LEVEL",
  "染色尺寸必须是 0.25 的倍数": "INVALID_DYE_SIZE",
  "长尺寸必须是 0.25 的倍数": "INVALID_DYE_SIZE",
  "短尺寸必须是 0.25 的倍数": "INVALID_DYE_SIZE",
  "非间色假发的机器规格清单中不允许设置 DML比值": "INVALID_DML",
  裁断重量项最多3个: "INVALID_CUT_WEIGHT_COUNT",
  DML比值最多1位小数: "INVALID_DML",
}

export function validateFileInput(file: 沐茵丝假发成品稿) {
  const parsed = FileSchema.safeParse(file)
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "参数校验失败"
    return {
      ok: false as const,
      message: msg,
      code: ErrorCodeByMessage[msg] ?? "INVALID_PARAMS",
    }
  }

  return {
    ok: true as const,
    file: parsed.data as unknown as 沐茵丝假发成品稿,
  }
}
