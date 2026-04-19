import { ApiCall } from "tsrpc"
import { ObjectId } from "mongodb"
import { Global } from "../models/Global"
import { ReqMe, ResMe } from "../shared/protocols/PtlMe"

export default async function (call: ApiCall<ReqMe, ResMe>) {
  const currentUid = (call as ApiCall<ReqMe, ResMe> & { currentUid?: string }).currentUid
  if (!currentUid) {
    call.error("需要先登录", { code: "NEED_LOGIN" })
    return
  }

  const user = await Global.getCollection("用户").findOne({ _id: new ObjectId(currentUid) })
  if (!user) {
    call.error("用户不存在", { code: "NEED_LOGIN" })
    return
  }

  call.succ({
    name: user.name,
    username: user.username,
  })
}