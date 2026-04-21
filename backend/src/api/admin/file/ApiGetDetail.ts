import { ApiCall } from "tsrpc"
import { ReqGetDetail, ResGetDetail } from "../../../shared/protocols/admin/file/PtlGetDetail"
import { Global } from "../../../models/Global"
import { to制品规格书Frontend } from "../../../shared/frontend/converters/to制品规格书Frontend"
import { to高针指示单Frontend } from "../../../shared/frontend/converters/to高针指示单Frontend"
import { to手织指示单Frontend } from "../../../shared/frontend/converters/to手织指示单Frontend"
import { normalize染色档位列表 } from "./normalizeDyeLevels"
import { normalize手织图, normalize高针图 } from "./normalizeNeedleGraphs"
import { ObjectId } from "mongodb"

function getHatMakingIdFromCAP(cap: string): string {
  return cap.trim().match(/^[^（(\s]+/)?.[0] ?? ""
}

export default async function (call: ApiCall<ReqGetDetail, ResGetDetail>) {
  if (!ObjectId.isValid(call.req.id)) {
    return call.error("找不到对应的成品稿", { code: "NOT_FOUND" })
  }
  const col = Global.getCollection("沐茵丝假发成品稿")
  const db稿 = await col.findOne({ _id: new ObjectId(call.req.id) })
  const 稿 = db稿
    ? {
        ...db稿,
        染色档位列表: normalize染色档位列表(db稿.染色档位列表),
        高针指示单: {
          ...db稿.高针指示单,
          高针图: normalize高针图(db稿.高针指示单?.高针图),
        },
        手织指示单: {
          ...db稿.手织指示单,
          手织图: normalize手织图(db稿.手织指示单?.手织图),
        },
      }
    : null
  if (!稿) {
    return call.error("找不到对应的成品稿", { code: "NOT_FOUND" })
  }

  const 比例Col = Global.getCollection("胶丝比例")
  const 制帽Col = Global.getCollection("制帽")
  const hatMakingId = getHatMakingIdFromCAP(稿.CAP)
  if (!hatMakingId) {
    return call.error("CAP格式无法识别制帽编号", { code: "INVALID_CAP_FORMAT" })
  }

  const [胶丝比例, 制帽] = await Promise.all([
    比例Col.findOne({
      _id: {
        颜色编号: 稿.制品规格书.胶丝比例id.颜色编号,
        发丝种类: 稿.制品规格书.胶丝比例id.发丝种类,
      },
    }),
    制帽Col.findOne({ _id: hatMakingId }),
  ])

  if (!胶丝比例) {
    return call.error("找不到对应的胶丝比例", { code: "RATIO_NOT_FOUND" })
  }

  if (!制帽) {
    return call.error("找不到对应的制帽规格", { code: "HAT_MAKING_NOT_FOUND" })
  }

  const rawFile = {
    ...稿,
    制品规格书: {
      ...稿.制品规格书,
      制帽: {
        唛头: 稿.制品规格书.制帽?.唛头 ?? "",
      },
    },
  }

  call.succ({
    file: {
      _id: 稿._id.toHexString(),
      样品编号: 稿.样品编号,
      制品规格书: to制品规格书Frontend(稿, 胶丝比例, 制帽),
      高针指示单: to高针指示单Frontend(稿),
      手织指示单: to手织指示单Frontend(稿),
    },
    rawFile,
  })
}
