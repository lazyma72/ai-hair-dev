import { ApiCall } from "tsrpc"
import { Global } from "../../../models/Global"
import { ReqAdd, ResAdd } from "../../../shared/protocols/admin/customer/PtlAdd"

export default async function (call: ApiCall<ReqAdd, ResAdd>) {
  const 客户编号 = call.req.客户编号?.trim()

  if (!客户编号) {
    return call.error("客户编号不能为空", { code: "EMPTY_CUSTOMER_NO" })
  }

  const col = Global.getCollection("客户")
  const existing = await col.findOne({ _id: 客户编号 })
  if (existing) {
    return call.error("客户编号已存在", { code: "DUPLICATE_CUSTOMER_NO" })
  }

  await col.insertOne({ _id: 客户编号, 客户编号 })
  call.succ({ id: 客户编号 })
}
