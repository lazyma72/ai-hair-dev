import { ApiCall } from "tsrpc"
import { ReqGetDetail, ResGetDetail } from "../../../shared/protocols/admin/ratio/PtlGetDetail"
import { Global } from "../../../models/Global"
import { 胶丝比例Frontend } from "../../../shared/frontend/model/model"

export default async function (call: ApiCall<ReqGetDetail, ResGetDetail>) {
  const col = Global.getCollection("胶丝比例")
  const doc = await col.findOne({ "_id.颜色编号": call.req.id })
  if (!doc) {
    return call.error("找不到对应的胶丝比例", { code: "NOT_FOUND" })
  }
  const { 颜色图片参考, ...rest } = doc
  const 胶丝比例: 胶丝比例Frontend = {
    ...rest,
    颜色图片参考: 颜色图片参考 ? Buffer.from(颜色图片参考).toString("base64") : undefined,
  }
  call.succ({ 胶丝比例 })
}
