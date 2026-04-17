import { ApiCall } from "tsrpc"
import { Global } from "../../../models/Global"
import { ReqAdd, ResAdd } from "../../../shared/protocols/admin/hatMaking/PtlAdd"

export default async function (call: ApiCall<ReqAdd, ResAdd>) {
  const 制帽编号 = call.req.制帽编号?.trim()
  const 名称 = call.req.名称?.trim()
  const 帽围 = Number(call.req.帽围)
  const 帽深 = Number(call.req.帽深)
  const 前后 = Number(call.req.前后)

  if (!制帽编号) {
    return call.error("制帽编号不能为空", { code: "EMPTY_HAT_MAKING_ID" })
  }
  if (!名称) {
    return call.error("制帽名称不能为空", { code: "EMPTY_HAT_MAKING_NAME" })
  }
  if (!(帽围 > 0)) {
    return call.error("帽围必须大于0", { code: "INVALID_HAT_AROUND" })
  }
  if (!(帽深 > 0)) {
    return call.error("帽深必须大于0", { code: "INVALID_HAT_DEPTH" })
  }
  if (!(前后 > 0)) {
    return call.error("前后必须大于0", { code: "INVALID_FRONT_BACK" })
  }

  const col = Global.getCollection("制帽")
  const existing = await col.findOne({ _id: 制帽编号 })
  if (existing) {
    return call.error("制帽编号已存在", { code: "DUPLICATE_HAT_MAKING_ID" })
  }

  await col.insertOne({
    _id: 制帽编号,
    名称,
    帽围,
    帽深,
    前后,
  })
  call.succ({ id: 制帽编号 })
}
