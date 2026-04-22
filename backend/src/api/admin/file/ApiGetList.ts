import { ApiCall } from "tsrpc"
import { z } from "zod"
import type { Filter, Sort } from "mongodb"
import { ReqGetList, ResGetList } from "../../../shared/protocols/admin/file/PtlGetList"
import { Global } from "../../../models/Global"
import { 假发类型, type 沐茵丝假发成品稿 } from "../../../shared/db/Db沐茵丝假发成品稿"

const ReqSchema = z.object({
  pageNum: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).default(20),
  keyword: z.string().optional(),
  orderSort: z.enum(["asc", "desc"]).default("desc"),
  filter: z
    .object({
      客户编号: z.string().optional(),
      品名: z.string().optional(),
      原材料: z.string().optional(),
      假发类型: z.nativeEnum(假发类型).optional(),
      CAP: z.string().optional(),
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
  const col = Global.getCollection("沐茵丝假发成品稿")

  const mongoFilter: Filter<沐茵丝假发成品稿> = {}
  if (filter.客户编号) mongoFilter.客户编号 = filter.客户编号
  if (filter.品名) mongoFilter.品名 = filter.品名
  if (filter.原材料) mongoFilter.原材料 = filter.原材料
  if (filter.假发类型) mongoFilter.假发类型 = filter.假发类型
  if (filter.CAP) mongoFilter.CAP = filter.CAP

  const kw = keyword?.trim()
  if (kw) {
    mongoFilter.$or = [
      { 样品编号: { $regex: kw, $options: "i" } },
      { 客户编号: { $regex: kw, $options: "i" } },
      { 品名: { $regex: kw, $options: "i" } },
      { 原材料: { $regex: kw, $options: "i" } },
      { CAP: { $regex: kw, $options: "i" } },
    ]
  }

  const sort: Sort = { _id: orderSort === "asc" ? 1 : -1 }

  const [total, list] = await Promise.all([
    col.countDocuments(mongoFilter),
    col
      .find(mongoFilter, {
        projection: {
          _id: 1,
          样品编号: 1,
          客户编号: 1,
          品名: 1,
          原材料: 1,
          假发类型: 1,
          CAP: 1,
          "制品规格书.胶丝比例id": 1,
        },
      })
      .sort(sort)
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .toArray(),
  ])

  call.succ({
    list: list.map(doc => ({
      _id: doc._id.toHexString(),
      样品编号: doc.样品编号,
      客户编号: doc.客户编号,
      品名: doc.品名,
      原材料: doc.原材料,
      假发类型: doc.假发类型,
      CAP: doc.CAP,
      颜色编号: doc.制品规格书?.胶丝比例id?.颜色编号,
      发丝种类: doc.制品规格书?.胶丝比例id?.发丝种类,
    })),
    total,
    pageNum,
    pageSize,
  })
}
