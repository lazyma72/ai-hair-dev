import { ApiCall } from "tsrpc"
import { ReqUpdate, ResUpdate } from "../../../shared/protocols/admin/file/PtlUpdate"
import { Global } from "../../../models/Global"
import { validateFileInput } from "../hatMaking/fileValidation"
import { normalize染色档位列表 } from "./normalizeDyeLevels"
import { normalize手织图, normalize高针图 } from "./normalizeNeedleGraphs"
import { ObjectId } from "mongodb"

function getHatMakingIdFromCAP(cap: string): string {
  return cap.trim().match(/^[^（(\s]+/)?.[0] ?? ""
}

export default async function (call: ApiCall<ReqUpdate, ResUpdate>) {
  const { id, file } = call.req
  const now = new Date()
  if (!ObjectId.isValid(id)) {
    return call.error("找不到对应的成品稿", { code: "NOT_FOUND" })
  }
  const objectId = new ObjectId(id)
  const normalizedInput = {
    ...file,
    染色档位列表: normalize染色档位列表(file.染色档位列表),
    高针指示单: {
      ...file.高针指示单,
      高针图: normalize高针图(file.高针指示单?.高针图),
    },
    手织指示单: {
      ...file.手织指示单,
      手织图: normalize手织图(file.手织指示单?.手织图),
    },
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
  const existing = await col.findOne({ _id: objectId })
  if (!existing) {
    return call.error("找不到对应的成品稿", { code: "NOT_FOUND" })
  }

  const duplicated = await col.findOne({
    样品编号: normalizedFile.样品编号,
    "制品规格书.胶丝比例id.颜色编号": normalizedFile.制品规格书.胶丝比例id.颜色编号,
    "制品规格书.胶丝比例id.发丝种类": normalizedFile.制品规格书.胶丝比例id.发丝种类,
    _id: { $ne: objectId },
  } as any)
  if (duplicated) {
    return call.error("该样品编号 + 胶丝比例已存在", { code: "DUPLICATE_ID" })
  }

  // ApiUpdate uses replaceOne; we must preserve server-managed fields,
  // otherwise they would be overwritten / lost.
  const fileToSave = {
    ...normalizedFile,
    tag: normalizedFile.tag ?? existing.tag ?? "成品稿",
    文件名称: normalizedFile.文件名称 ?? existing.文件名称,
    createTime: existing.createTime ?? now,
    updateTime: now,
  }

  await col.replaceOne({ _id: objectId }, fileToSave)
  call.succ({ id })
}
