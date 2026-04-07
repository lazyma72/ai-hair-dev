import { ApiCall } from "tsrpc"
import { ReqGetList, ResGetList } from "../../../shared/protocols/admin/ratio/PtlGetList"
import { Global } from "../../../models/Global"

export default async function (call: ApiCall<ReqGetList, ResGetList>) {
  const col = Global.getCollection("胶丝比例")
  const docs = await col.find({}, { projection: { _id: 1, 线色: 1 } }).toArray()
  call.succ({
    list: docs.map(doc => ({ _id: doc._id, 线色: doc.线色 })),
  })
}
