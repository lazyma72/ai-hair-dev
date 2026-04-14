import { ApiCall } from "tsrpc"
import { ReqGetList, ResGetList } from "../../../shared/protocols/admin/file/PtlGetList"
import { Global } from "../../../models/Global"

export default async function (call: ApiCall<ReqGetList, ResGetList>) {
  const col = Global.getCollection("沐茵丝假发成品稿")
  const pageNum = Math.max(1, call.req.pageNum ?? 1)
  const keyword = call.req.keyword?.trim().toLowerCase() ?? ""
  const orderSort = call.req.orderSort ?? "desc"
  const filter = call.req.filter ?? {}
  const docs = await col
    .find(
      {},
      {
        projection: {
          _id: 1,
          客户编号: 1,
          品名: 1,
          原材料: 1,
          假发类型: 1,
          CAP: 1,
        },
      }
    )
    .toArray()
  const filteredDocs = docs
    .filter(doc => (filter.客户编号 ? doc.客户编号 === filter.客户编号 : true))
    .filter(doc => (filter.品名 ? doc.品名 === filter.品名 : true))
    .filter(doc => (filter.原材料 ? doc.原材料 === filter.原材料 : true))
    .filter(doc => (filter.假发类型 ? doc.假发类型 === filter.假发类型 : true))
    .filter(doc => (filter.CAP ? doc.CAP === filter.CAP : true))
    .filter(doc => {
      if (!keyword) return true
      return `${doc._id} ${doc.客户编号} ${doc.品名} ${doc.原材料} ${doc.CAP}`
        .toLowerCase()
        .includes(keyword)
    })
    .sort((a, b) => (orderSort === "asc" ? a._id.localeCompare(b._id) : b._id.localeCompare(a._id)))

  const total = filteredDocs.length
  const pageSize = Math.max(1, call.req.pageSize ?? Math.max(total, 1))
  const start = (pageNum - 1) * pageSize
  const pageDocs = filteredDocs.slice(start, start + pageSize)

  call.succ({
    list: pageDocs.map(doc => ({
      _id: doc._id,
      客户编号: doc.客户编号,
      品名: doc.品名,
      原材料: doc.原材料,
      假发类型: doc.假发类型,
      CAP: doc.CAP,
    })),
    total,
    pageNum,
    pageSize,
  })
}
