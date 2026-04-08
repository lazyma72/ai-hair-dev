import { ApiCall } from "tsrpc"
import { Global } from "../../../models/Global"
import { 假发类型 } from "../../../shared/db/Db沐茵丝假发成品稿"
import { ReqAdd, ResAdd } from "../../../shared/protocols/admin/file/PtlAdd"

function isEmptyStr(v: unknown): v is "" {
  return typeof v !== "string" || v.trim() === ""
}

function isQuarterInch(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && Math.round(n * 4) === n * 4
}

export default async function (call: ApiCall<ReqAdd, ResAdd>) {
  const { file } = call.req

  if (isEmptyStr(file._id)) {
    return call.error("样品编号不能为空", { code: "EMPTY_FILE_ID" })
  }
  if (isEmptyStr(file.客户编号)) {
    return call.error("客户编号不能为空", { code: "EMPTY_CUSTOMER_NO" })
  }
  if (isEmptyStr(file.品名)) {
    return call.error("品名不能为空", { code: "EMPTY_PRODUCT_NAME" })
  }
  if (isEmptyStr(file.CAP)) {
    return call.error("CAP不能为空", { code: "EMPTY_CAP" })
  }
  if (isEmptyStr(file.原材料)) {
    return call.error("原材料不能为空", { code: "EMPTY_MATERIAL" })
  }

  // 客户编号必须存在于「客户」集合
  const customerCol = Global.getCollection("客户")
  const customer = await customerCol.findOne({ _id: file.客户编号 })
  if (!customer) {
    return call.error("客户编号不存在，请先在客户列表中创建", {
      code: "INVALID_CUSTOMER_NO",
    })
  }

  // 染色档位列表校验：每张染色图可多选档位，但一个档位最多对应一张染色图；尺寸必须是 0.25 的倍数
  const usedSlots = new Set<string>()

  for (const item of file.染色档位列表 ?? []) {
    const slots = item.染色图.档位标注.档位列表
    if (!Array.isArray(slots)) {
      return call.error("每张染色图至少选择一个适用档位", {
        code: "INVALID_DYE_LEVEL",
      })
    }

    const normalized = Array.from(
      new Set(
        slots
          .map((s) => (typeof s === "string" ? s.trim() : ""))
          .filter((s) => s !== ""),
      ),
    )

    if (normalized.length < 1) {
      return call.error("每张染色图至少选择一个适用档位", {
        code: "INVALID_DYE_LEVEL",
      })
    }

    for (const slot of normalized) {
      if (usedSlots.has(slot)) {
        return call.error("一个档位最多对应一张染色图，请调整重复项", {
          code: "DUPLICATE_DYE_LEVEL",
        })
      }
      usedSlots.add(slot)
    }

    if (!isQuarterInch(item.染色图.染色尺寸标注.尺寸)) {
      return call.error("染色尺寸必须是 0.25 的倍数", {
        code: "INVALID_DYE_SIZE",
      })
    }

    if (item.type === "错位") {
      if (!isQuarterInch(item.染色图.长尺寸标注.尺寸)) {
        return call.error("长尺寸必须是 0.25 的倍数", {
          code: "INVALID_DYE_SIZE",
        })
      }
      if (item.染色图.短尺寸标注 && !isQuarterInch(item.染色图.短尺寸标注.尺寸)) {
        return call.error("短尺寸必须是 0.25 的倍数", {
          code: "INVALID_DYE_SIZE",
        })
      }
    }
  }

  // DML比值 仅间色假发才允许存在
  if (file.假发类型 !== 假发类型.间色) {
    const hasDML = file.制品规格书.机器规格清单.some((row) => row.DML比值 != null)
    if (hasDML) {
      return call.error("非间色假发的机器规格清单中不允许设置 DML比值", {
        code: "INVALID_DML",
      })
    }
  }

  const col = Global.getCollection("沐茵丝假发成品稿")
  const existing = await col.findOne({ _id: file._id })
  if (existing) {
    return call.error("该样品编号已存在", { code: "DUPLICATE_ID" })
  }

  await col.insertOne(file)
  call.succ({ id: file._id })
}
