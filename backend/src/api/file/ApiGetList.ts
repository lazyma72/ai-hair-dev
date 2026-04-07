import { ApiCall } from "tsrpc"
import { ReqGetList, ResGetList } from "../../shared/protocols/file/PtlGetList"
import { Global } from "../../models/Global"

export default async function (call: ApiCall<ReqGetList, ResGetList>) {
  const col = Global.getCollection("沐茵丝假发成品稿")
  const docs = await col
    .find({}, { projection: { _id: 1, 客户: 1, 品名: 1, 假发类型: 1, CAP: 1 } })
    .toArray()
  call.succ({
    list: docs.map(doc => ({
      _id: doc._id,
      客户: doc.客户,
      品名: doc.品名,
      假发类型: doc.假发类型,
      CAP: doc.CAP,
    })),
  })
}
