import { ApiCall } from "tsrpc"
import { Global } from "../../../models/Global"
import { ReqGetDetail, ResGetDetail } from "../../../shared/protocols/admin/hatMaking/PtlGetDetail"

function normalizeHatMaking(item: {
  _id: string
  名称?: string
  帽围: number
  帽深: number
  前后: number
}) {
  return {
    ...item,
    名称: item.名称 ?? "",
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

  call.succ({ 制帽: normalizeHatMaking(制帽) })
}
