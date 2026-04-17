import { ApiCall } from "tsrpc"
import { z } from "zod"
import type { Filter, Sort } from "mongodb"
import { ReqGetList, ResGetList } from "../../../shared/protocols/admin/ratio/PtlGetList"
import { Global } from "../../../models/Global"
import type { Db胶丝比例 } from "../../../shared/db/Db胶丝比例"

const ReqSchema = z.object({
  pageNum: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).default(20),
  keyword: z.string().optional(),
  orderSort: z.enum(["asc", "desc"]).default("desc"),
  filter: z
    .object({
      颜色编号: z.string().optional(),
      发丝种类: z.string().optional(),
      线色: z.string().optional(),
      D: z.boolean().optional(),
      M: z.boolean().optional(),
      L: z.boolean().optional(),
    })
    .default({}),
})

export default async function (call: ApiCall<ReqGetList, ResGetList>) {
  const parsed = ReqSchema.safeParse(call.req)
  if (!parsed.success) {
    call.error("参数错误: " + parsed.error.message)
    return
  }

  const { pageNum, pageSize, keyword, orderSort, filter } = parsed.data
  const col = Global.getCollection("胶丝比例")

  const conditions: Filter<Db胶丝比例>[] = []

  if (filter.颜色编号) {
    conditions.push({ "_id.颜色编号": filter.颜色编号 } as Filter<Db胶丝比例>)
  }
  if (filter.发丝种类) {
    conditions.push({ "_id.发丝种类": filter.发丝种类 } as Filter<Db胶丝比例>)
  }
  if (filter.线色) {
    conditions.push({ 线色: filter.线色 })
  }

  const kw = keyword?.trim()
  if (kw) {
    conditions.push({
      $or: [
        { "_id.颜色编号": { $regex: kw, $options: "i" } } as Filter<Db胶丝比例>,
        { "_id.发丝种类": { $regex: kw, $options: "i" } } as Filter<Db胶丝比例>,
        { 线色: { $regex: kw, $options: "i" } },
      ],
    })
  }

  const mongoFilter: Filter<Db胶丝比例> = conditions.length > 0 ? { $and: conditions } : {}

  const sortDir = orderSort === "asc" ? 1 : -1
  const sort: Sort = { "_id.发丝种类": sortDir, "_id.颜色编号": sortDir }

  const [total, docs] = await Promise.all([
    col.countDocuments(mongoFilter),
    col
      .find(mongoFilter, { projection: { _id: 1, 线色: 1 } })
      .sort(sort)
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .toArray(),
  ])

  call.succ({
    list: docs.map(doc => ({
      _id: doc._id.颜色编号,
      发丝种类: doc._id.发丝种类,
      线色: doc.线色,
    })),
    total,
    pageNum,
    pageSize,
  })
}
