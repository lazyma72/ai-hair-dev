import { ApiCall } from "tsrpc"
import { Global } from "../../../models/Global"
import {
  ReqGetHairTypes,
  ResGetHairTypes,
} from "../../../shared/protocols/admin/ratio/PtlGetHairTypes"

export default async function (call: ApiCall<ReqGetHairTypes, ResGetHairTypes>) {
  const col = Global.getCollection("胶丝比例")
  const list = ((await col.distinct("_id.发丝种类")) as string[])
    .map(item => item?.trim?.() ?? "")
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "zh-CN"))

  call.succ({ list })
}
