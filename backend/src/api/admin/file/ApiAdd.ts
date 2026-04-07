import { ApiCall } from "tsrpc"
import { ReqAdd, ResAdd } from "../../../shared/protocols/admin/file/PtlAdd"
import { Global } from "../../../models/Global"
import { 假发类型 } from "../../../shared/db/Db沐茵丝假发成品稿"

export default async function (call: ApiCall<ReqAdd, ResAdd>) {
  const { file } = call.req

  // DML比值 仅间色假发才允许存在
  if (file.假发类型 !== 假发类型.间色) {
    const hasDML = file.制品规格书.机器规格清单.some(row => row.DML比值 != null)
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
