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
  const 制帽Col = Global.getCollection("制帽")
  const [胶丝比例, 制帽] = await Promise.all([
    比例Col.findOne({
      _id: {
        颜色编号: 稿.制品规格书.胶丝比例id.颜色编号,
        发丝种类: 稿.制品规格书.胶丝比例id.发丝种类,
      },
    }),
    制帽Col.findOne({ _id: 稿.制品规格书.制帽.编号 }),
  ])

  if (!胶丝比例) {
    return call.error("找不到对应的胶丝比例", { code: "RATIO_NOT_FOUND" })
  }

  if (!制帽) {
    return call.error("找不到对应的制帽规格", { code: "HAT_MAKING_NOT_FOUND" })
  }

  call.succ({
    file: {
      _id: 稿._id,
      制品规格书: to制品规格书Frontend(稿, 胶丝比例, 制帽),
      高针指示单: to高针指示单Frontend(稿),
      手织指示单: to手织指示单Frontend(稿),
    },
    rawFile: 稿,
  })
}
