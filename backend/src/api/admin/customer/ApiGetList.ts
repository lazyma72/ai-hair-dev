import { ApiCall } from "tsrpc"
import { Global } from "../../../models/Global"
import {
  ReqGetList,
  ResGetList,
} from "../../../shared/protocols/admin/customer/PtlGetList"

export default async function (call: ApiCall<ReqGetList, ResGetList>) {
  const col = Global.getCollection("客户")

  const keyword = call.req.keyword?.trim()
  const query = keyword
    ? ({ 客户编号: { $regex: keyword, $options: "i" } } as const)
    : {}

  const list = await col.find(query).limit(200).toArray()
  call.succ({ list })
}
