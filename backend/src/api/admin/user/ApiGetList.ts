import { ApiCall } from "tsrpc"
import type { Filter } from "mongodb"
import { ObjectId } from "mongodb"
import { Global } from "../../../models/Global"
import type { DbUser } from "../../../shared/db/DbUser"
import {
  ReqGetList,
  ResGetList,
  UserListItem,
} from "../../../shared/protocols/admin/user/PtlGetList"

export default async function (call: ApiCall<ReqGetList, ResGetList>) {
  const col = Global.getCollection("用户")

  const keyword = call.req.keyword?.trim()
  const query: Filter<DbUser> = {}
  if (keyword) {
    const ors: Filter<DbUser>[] = [
      { name: { $regex: keyword, $options: "i" } },
      { username: { $regex: keyword, $options: "i" } },
    ]

    // Allow searching by ObjectId hex string.
    if (/^[0-9a-fA-F]{24}$/.test(keyword)) {
      try {
        ors.push({ _id: new ObjectId(keyword) })
      } catch {
        // ignore invalid ObjectId
      }
    }

    query.$or = ors
  }

  const docs = await col
    .find(query, { projection: { password: 0 } })
    .sort({ createTime: -1 })
    .toArray()

  const list: UserListItem[] = docs.map(u => ({
    _id: u._id.toHexString(),
    name: u.name,
    username: u.username,
    role: u.role,
    createTime: u.createTime.toISOString(),
    updateTime: u.updateTime.toISOString(),
  }))

  call.succ({ list })
}
