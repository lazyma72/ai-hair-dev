import { ApiCall } from "tsrpc"
import { Global } from "../../../models/Global"
import { ReqGetList, ResGetList } from "../../../shared/protocols/admin/hatMaking/PtlGetList"

export default async function (call: ApiCall<ReqGetList, ResGetList>) {
  const col = Global.getCollection("制帽")
  const pageNum = Math.max(1, call.req.pageNum ?? 1)
  const orderSort = call.req.orderSort ?? "asc"
  const keyword = call.req.keyword?.trim().toLowerCase() ?? ""

  const docs = await col.find({}).toArray()
  const filteredDocs = docs
    .filter(doc => {
      if (!keyword) return true
      return `${doc._id}`.toLowerCase().includes(keyword)
    })
    .sort((a, b) =>
      orderSort === "asc"
        ? a._id.localeCompare(b._id)
        : b._id.localeCompare(a._id)
    )

  const total = filteredDocs.length
  const pageSize = Math.max(1, call.req.pageSize ?? Math.max(total, 1))
  const start = (pageNum - 1) * pageSize
  const list = filteredDocs.slice(start, start + pageSize)

  call.succ({
    list,
    total,
    pageNum,
    pageSize,
  })
}
