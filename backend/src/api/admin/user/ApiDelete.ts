import { ApiCall } from "tsrpc"
import { ObjectId } from "mongodb"
import { Global } from "../../../models/Global"
import { ReqDelete, ResDelete } from "../../../shared/protocols/admin/user/PtlDelete"

export default async function (call: ApiCall<ReqDelete, ResDelete>) {
  const id = call.req.id?.trim()
  if (!id) {
    return call.error("用户ID不能为空", { code: "EMPTY_USER_ID" })
  }

  const col = Global.getCollection("用户")
  let oid: ObjectId
  try {
    oid = new ObjectId(id)
  } catch {
    return call.error("用户ID格式不正确", { code: "INVALID_USER_ID" })
  }

  const res = await col.deleteOne({ _id: oid })
  if (!res.deletedCount) {
    return call.error("用户不存在", { code: "USER_NOT_FOUND" })
  }

  call.succ({})
}
