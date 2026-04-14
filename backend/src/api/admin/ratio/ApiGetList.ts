import { ApiCall } from "tsrpc"
import { ReqGetList, ResGetList } from "../../../shared/protocols/admin/ratio/PtlGetList"
import { Global } from "../../../models/Global"

export default async function (call: ApiCall<ReqGetList, ResGetList>) {
  const col = Global.getCollection("胶丝比例")
  const pageNum = Math.max(1, call.req.pageNum ?? 1)
  const keyword = call.req.keyword?.trim().toLowerCase() ?? ""
  const orderSort = call.req.orderSort ?? "desc"
  const filter = call.req.filter ?? {}
  const docs = await col.find({}, { projection: { _id: 1, 线色: 1 } }).toArray()
  const filteredDocs = docs
    .filter(doc => (filter.颜色编号 ? doc._id.颜色编号 === filter.颜色编号 : true))
    .filter(doc => (filter.发丝种类 ? doc._id.发丝种类 === filter.发丝种类 : true))
    .filter(doc => (filter.线色 ? (doc.线色 ?? "") === filter.线色 : true))
    .filter(doc => {
      if (!keyword) return true
      return `${doc._id.颜色编号} ${doc._id.发丝种类} ${doc.线色 ?? ""}`
        .toLowerCase()
        .includes(keyword)
    })
    .sort((a, b) => {
      const ak = `${a._id.发丝种类}-${a._id.颜色编号}`
      const bk = `${b._id.发丝种类}-${b._id.颜色编号}`
      return orderSort === "asc" ? ak.localeCompare(bk) : bk.localeCompare(ak)
    })

  const total = filteredDocs.length
  const pageSize = Math.max(1, call.req.pageSize ?? Math.max(total, 1))
  const start = (pageNum - 1) * pageSize
  const pageDocs = filteredDocs.slice(start, start + pageSize)

  call.succ({
    list: pageDocs.map(doc => ({
      _id: doc._id.颜色编号,
      发丝种类: doc._id.发丝种类,
      线色: doc.线色,
    })),
    total,
    pageNum,
    pageSize,
  })
}
