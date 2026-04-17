import { ApiCall } from "tsrpc"
import { Global } from "../../../models/Global"
import { ReqAdd, ResAdd } from "../../../shared/protocols/admin/file/PtlAdd"
import { validateFileInput } from "./fileValidation"
import { normalize染色档位列表 } from "./normalizeDyeLevels"

function getHatMakingIdFromCAP(cap: string): string {
  return cap.trim().match(/^[^（(\s]+/)?.[0] ?? ""
}

export default async function (call: ApiCall<ReqAdd, ResAdd>) {
  const normalizedInput = {
    ...call.req.file,
    染色档位列表: normalize染色档位列表(call.req.file.染色档位列表),
  }

  const validation = validateFileInput(normalizedInput)
  if (!validation.ok) {
    return call.error(validation.message, { code: validation.code })
  }

  const normalizedFile = {
    ...validation.file,
    制品规格书: {
      ...validation.file.制品规格书,
      制帽: {
        唛头: validation.file.制品规格书.制帽?.唛头 ?? "",
      },
    },
  }

  // 客户编号必须存在于「客户」集合
  const customerCol = Global.getCollection("客户")
  const customer = await customerCol.findOne({ _id: normalizedFile.客户编号 })
  if (!customer) {
    return call.error("客户编号不存在，请先在客户列表中创建", {
      code: "INVALID_CUSTOMER_NO",
    })
  }

  const hatMakingId = getHatMakingIdFromCAP(normalizedFile.CAP)
  if (!hatMakingId) {
    return call.error("CAP格式无法识别制帽编号", { code: "INVALID_CAP_FORMAT" })
  }

  const hatMakingCol = Global.getCollection("制帽")
  const hatMaking = await hatMakingCol.findOne({ _id: hatMakingId })
  if (!hatMaking) {
    return call.error(`CAP关联的制帽编号「${hatMakingId}」不存在，请先在制帽列表中创建`, {
      code: "INVALID_HAT_MAKING_NO",
    })
  }

  const col = Global.getCollection("沐茵丝假发成品稿")
  const existing = await col.findOne({ _id: normalizedFile._id })
  if (existing) {
    return call.error("该样品编号已存在", { code: "DUPLICATE_ID" })
  }

  await col.insertOne(normalizedFile)
  call.succ({ id: normalizedFile._id })
}
