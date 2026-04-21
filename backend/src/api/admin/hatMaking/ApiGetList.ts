import { ApiCall } from "tsrpc"
import { z } from "zod"
import type { Filter, Sort } from "mongodb"
import { Global } from "../../../models/Global"
import type { Db制帽 } from "../../../shared/db/Db制帽"
import { ReqGetList, ResGetList } from "../../../shared/protocols/admin/hatMaking/PtlGetList"

const ReqSchema = z.object({
  pageNum: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).default(20),
  keyword: z.string().optional(),
  orderSort: z.enum(["asc", "desc"]).default("asc"),
})

function normalizeHatMaking(item: Db制帽): Db制帽 {
  return {
    ...item,
    名称: item.名称 ?? "",
    帽网款式: item.帽网款式 ?? "",
    备注: item.备注 ?? undefined,
    imgList: item.imgList ?? [],
  }
}

export default async function (call: ApiCall<ReqGetList, ResGetList>) {
  const parsed = ReqSchema.safeParse(call.req)
  if (!parsed.success) {
    call.error("参数错误: " + parsed.error.message)
    return
  }

  const { pageNum, pageSize, keyword, orderSort } = parsed.data
  const col = Global.getCollection("制帽")

  const mongoFilter: Filter<Db制帽> = {}
  const kw = keyword?.trim()
  if (kw) {
    mongoFilter._id = { $regex: kw, $options: "i" } as Filter<Db制帽>["_id"]
  }

  const sort: Sort = { _id: orderSort === "asc" ? 1 : -1 }

  const [total, list] = await Promise.all([
    col.countDocuments(mongoFilter),
    col
      .find(mongoFilter)
      .sort(sort)
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .toArray(),
  ])

  call.succ({
    list: list.map(item => normalizeHatMaking(item as Db制帽)),
    total,
    pageNum,
    pageSize,
  })
}
