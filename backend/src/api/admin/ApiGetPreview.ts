import { ApiCall } from "tsrpc"
import { Global } from "../../models/Global"
import { ReqGetPreview, ResGetPreview } from "../../shared/protocols/admin/PtlGetPreview"

export default async function (call: ApiCall<ReqGetPreview, ResGetPreview>) {
  const fileCol = Global.getCollection("沐茵丝假发成品稿")
  const hatMakingCol = Global.getCollection("制帽")
  const ratioCol = Global.getCollection("胶丝比例")
  const customerCol = Global.getCollection("客户")

  const [设计稿总数, 制帽总数, 胶丝比例总数, 客户总数] = await Promise.all([
    fileCol.countDocuments({}),
    hatMakingCol.countDocuments({}),
    ratioCol.countDocuments({}),
    customerCol.countDocuments({}),
  ])

  call.succ({
    设计稿总数,
    制帽总数,
    胶丝比例总数,
    客户总数,
  })
}
