import { ApiCall } from "tsrpc"
import { Global } from "../../../models/Global"
import type { Db制帽 } from "../../../shared/db/Db制帽"
import { ReqGetDetail, ResGetDetail } from "../../../shared/protocols/admin/hatMaking/PtlGetDetail"

function normalizeHatMaking(item: Db制帽): Db制帽 {
  return {
    ...item,
    名称: item.名称 ?? "",
    高针图: item.高针图 ?? undefined,
    手织图: item.手织图 ?? undefined,
    高针图系统预置区域列表: item.高针图系统预置区域列表 ?? [],
    手织图系统预置区域列表: item.手织图系统预置区域列表 ?? [],
  }
}

export default async function (call: ApiCall<ReqGetDetail, ResGetDetail>) {
  const id = call.req.id?.trim()
  if (!id) {
    return call.error("制帽编号不能为空", { code: "EMPTY_HAT_MAKING_ID" })
  }

  const col = Global.getCollection("制帽")
  const 制帽 = await col.findOne({ _id: id })
  if (!制帽) {
    return call.error("找不到对应的制帽规格", { code: "NOT_FOUND" })
  }

  call.succ({ 制帽: normalizeHatMaking(制帽 as Db制帽) })
}
