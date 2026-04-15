import { ApiCall } from "tsrpc"
import { Global } from "../../../models/Global"
import { ReqAdd, ResAdd } from "../../../shared/protocols/admin/user/PtlAdd"
import type { DbUser } from "../../../shared/db/DbUser"

export default async function (call: ApiCall<ReqAdd, ResAdd>) {
  const name = call.req.name?.trim()
  const username = call.req.username?.trim()
  const password = call.req.password?.trim()

  if (!name) {
    return call.error("姓名不能为空", { code: "EMPTY_NAME" })
  }
  if (!username) {
    return call.error("账号不能为空", { code: "EMPTY_USERNAME" })
  }
  if (!password) {
    return call.error("密码不能为空", { code: "EMPTY_PASSWORD" })
  }

  const col = Global.getCollection("用户")
  const existing = await col.findOne({ username })
  if (existing) {
    return call.error("账号已存在", { code: "DUPLICATE_USERNAME" })
  }

  const now = new Date()

  // TODO: password should be hashed before storage.
  const insertDoc: Omit<DbUser, "_id"> = {
    name,
    username,
    password,
    role: "admin",
    createTime: now,
    updateTime: now,
  }

  const res = await col.insertOne(insertDoc as unknown as DbUser)

  call.succ({ id: res.insertedId.toHexString() })
}
