import { ApiCall } from "tsrpc"
import { Global } from "../../../models/Global"
import { ReqAdd, ResAdd } from "../../../shared/protocols/admin/file/PtlAdd"
import { validateFileInput } from "./fileValidation"

export default async function (call: ApiCall<ReqAdd, ResAdd>) {
  const { file } = call.req

  const validation = validateFileInput(file)
  if (!validation.ok) {
    return call.error(validation.message, { code: validation.code })
  }

  // 客户编号必须存在于「客户」集合
  const customerCol = Global.getCollection("客户")
  const customer = await customerCol.findOne({ _id: file.客户编号 })
  if (!customer) {
    return call.error("客户编号不存在，请先在客户列表中创建", {
      code: "INVALID_CUSTOMER_NO",
    })
  }

  const col = Global.getCollection("沐茵丝假发成品稿")
  const existing = await col.findOne({ _id: file._id })
  if (existing) {
    return call.error("该样品编号已存在", { code: "DUPLICATE_ID" })
  }

  await col.insertOne(file)
  call.succ({ id: file._id })
}
