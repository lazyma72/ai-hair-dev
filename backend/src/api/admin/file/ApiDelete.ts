import { ApiCall } from "tsrpc"
import { Global } from "../../../models/Global"
import { ReqDelete, ResDelete } from "../../../shared/protocols/admin/file/PtlDelete"
import { ObjectId } from "mongodb"

export default async function (call: ApiCall<ReqDelete, ResDelete>) {
  const id = (call.req.id ?? "").trim()
  if (!id) {
    return call.error("缺少 id 参数", { code: "MISSING_ID" })
  }
  if (!ObjectId.isValid(id)) {
    return call.error("未找到该记录", { code: "NOT_FOUND" })
  }

  const col = Global.getCollection("沐茵丝假发成品稿")
  const result = await col.deleteOne({ _id: new ObjectId(id) })

  if (result.deletedCount === 0) {
    return call.error("未找到该记录", { code: "NOT_FOUND" })
  }

  call.succ({})
}
