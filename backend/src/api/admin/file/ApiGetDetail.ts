import { ApiCall } from "tsrpc"
import { ReqGetDetail, ResGetDetail } from "../../../shared/protocols/admin/file/PtlGetDetail"
import { Global } from "../../../models/Global"
import { to制品规格书Frontend } from "../../../shared/frontend/converters/to制品规格书Frontend"
import { to高针指示单Frontend } from "../../../shared/frontend/converters/to高针指示单Frontend"
import { to手织指示单Frontend } from "../../../shared/frontend/converters/to手织指示单Frontend"

export default async function (call: ApiCall<ReqGetDetail, ResGetDetail>) {
  const col = Global.getCollection("沐茵丝假发成品稿")
  const 稿 = await col.findOne({ _id: call.req.id })
  if (!稿) {
    return call.error("找不到对应的成品稿", { code: "NOT_FOUND" })
  }

  const 比例Col = Global.getCollection("胶丝比例")
  const 胶丝比例列表 = await 比例Col
    .find({ "_id.颜色编号": 稿.制品规格书.胶丝比例id.颜色编号 })
    .toArray()

  call.succ({
    file: {
      _id: 稿._id,
      制品规格书: to制品规格书Frontend(稿, 胶丝比例列表),
      高针指示单: to高针指示单Frontend(稿),
      手织指示单: to手织指示单Frontend(稿),
    },
  })
}
