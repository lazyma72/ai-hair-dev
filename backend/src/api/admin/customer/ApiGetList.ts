import { ApiCall } from "tsrpc"
import type { Filter } from "mongodb"
import { Global } from "../../../models/Global"
import type { DbCustomer } from "../../../shared/db/DbCustomer"
import { ReqGetList, ResGetList } from "../../../shared/protocols/admin/customer/PtlGetList"

export default async function (call: ApiCall<ReqGetList, ResGetList>) {
  const col = Global.getCollection("客户")

  const keyword = call.req.keyword?.trim()
  const query: Filter<DbCustomer> = {}
  if (keyword) {
    query.$or = [
      { 客户编号: { $regex: keyword, $options: "i" } },
      { 客户名称: { $regex: keyword, $options: "i" } },
    ]
  }

  const list = await col.find(query).limit(200).toArray()
  call.succ({ list })
}
