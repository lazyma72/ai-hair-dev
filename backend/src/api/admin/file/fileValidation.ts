import { z } from "zod"
import { 假发类型, type 沐茵丝假发成品稿提交 } from "../../../shared/db/Db沐茵丝假发成品稿"

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
        档位标注: z.object({
          档位列表: z.array(z.string()),
          textNodeId: z.string().trim().min(1, "染色档位标注缺少 textNodeId"),
        }),
        染色尺寸标注: z.object({
          尺寸: z.number(),
          textNodeId: z.string().trim().min(1, "染色尺寸标注缺少 textNodeId"),
        }),
        长尺寸标注: z
          .object({
            尺寸: z.number(),
            textNodeId: z.string().trim().min(1, "长尺寸标注缺少 textNodeId"),
          })
          .optional(),
        短尺寸标注: z
          .object({
            尺寸: z.number(),
            textNodeId: z.string().trim().min(1, "短尺寸标注缺少 textNodeId"),
          })
          .optional(),
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

const DML规则命令列表Schema = z.array(z.object({}).passthrough())

const 高针图Schema = z.object({
  底图: z
    .object({
      svg: z.string(),
      区域名: z.array(z.string()),
      区域线条: z.array(z.object({}).passthrough()),
      档位标注: z.array(z.object({}).passthrough()),
      文本节点: z.record(z.string(), z.object({}).passthrough()),
    })
    .passthrough(),
  自定义数据: z.object({
    DML规则命令列表: DML规则命令列表Schema,
    单双标注: z.array(z.object({}).passthrough()),
  }),
})

const 手织图比例项Schema = z.object({
  值: DMLValueSchema,
  是否染色: z.boolean().optional(),
  remark: z.string().optional(),
  sort: z.number().int().positive(),
})

const 手织图Schema = z.object({
  svg: z.string(),
  类型: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("横排"),
      groupNodeId: z.string().trim().min(1),
      比值: z.object({
        D: 手织图比例项Schema,
        M: 手织图比例项Schema.optional(),
        L: 手织图比例项Schema.optional(),
      }),
    }),
    z.object({
      type: z.literal("方形"),
      groupNodeId: z.string().trim().min(1),
      比值: z.object({
        D: 手织图比例项Schema,
        M: 手织图比例项Schema.optional(),
        L: 手织图比例项Schema.optional(),
      }),
      边长: z.number().positive("方形边长必须大于 0"),
    }),
    z.object({
      type: z.literal("特殊"),
    }),
  ]),
})

const FileSchema = z
  .object({
    样品编号: z.string().trim().min(1, "样品编号不能为空"),
    客户编号: z.string().trim().min(1, "客户编号不能为空"),
    品名: z.string().trim().min(1, "品名不能为空"),
    CAP: z.string().trim().min(1, "CAP不能为空"),
    原材料: z.string().trim().min(1, "原材料不能为空"),
    假发类型: z.nativeEnum(假发类型),
    tag: z.enum(["成品稿", "草稿"]).default("成品稿"),
    染色档位列表: z.array(DyeItemSchema),
    高针指示单: z.object({
      注意事项: z.string(),
      高针图: 高针图Schema,
    }),
    手织指示单: z.object({
      注意事项: z.string(),
      手织图: 手织图Schema,
    }),
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

    if (file.假发类型 !== 假发类型.间色 && file.假发类型 !== 假发类型.T色) {
      const hasDML = file.制品规格书.机器规格清单.some(row => row.DML比值 != null)
      if (hasDML) {
        ctx.addIssue({
          code: "custom",
          message: "非间色/T色假发的机器规格清单中不允许设置 DML比值",
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
  "染色档位标注缺少 textNodeId": "INVALID_DYE_TEMPLATE",
  "染色尺寸标注缺少 textNodeId": "INVALID_DYE_TEMPLATE",
  "长尺寸标注缺少 textNodeId": "INVALID_DYE_TEMPLATE",
  "短尺寸标注缺少 textNodeId": "INVALID_DYE_TEMPLATE",
  Required: "INVALID_GRAPH_TEMPLATE",
  "非间色/T色假发的机器规格清单中不允许设置 DML比值": "INVALID_DML",
  裁断重量项最多3个: "INVALID_CUT_WEIGHT_COUNT",
  DML比值最多1位小数: "INVALID_DML",
}

export function validateFileInput(file: 沐茵丝假发成品稿提交) {
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
    file: parsed.data as unknown as 沐茵丝假发成品稿提交,
  }
}
