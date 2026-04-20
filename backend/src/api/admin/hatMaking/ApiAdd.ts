import { ApiCall } from "tsrpc"
import { Global } from "../../../models/Global"
import { ReqAdd, ResAdd } from "../../../shared/protocols/admin/hatMaking/PtlAdd"

export default async function (call: ApiCall<ReqAdd, ResAdd>) {
  const 制帽编号 = call.req.制帽编号?.trim()
  const 名称 = call.req.名称?.trim()
  const 帽围 = Number(call.req.帽围)
  const 帽深 = Number(call.req.帽深)
  const 前后 = Number(call.req.前后)
  const 高针图 = call.req.高针图?.trim() || undefined
  const 手织图 = call.req.手织图?.trim() || undefined
  const 高针图系统预置区域列表 = (call.req.高针图系统预置区域列表 ?? [])
    .map(item => ({
      name: item.name?.trim() ?? "",
      lineLength: Number(item.lineLength),
    }))
    .filter(item => item.name)
  const 手织图系统预置区域列表 = (call.req.手织图系统预置区域列表 ?? [])
    .map(item => ({
      name: item.name?.trim() ?? "",
      lineLength: Number(item.lineLength),
    }))
    .filter(item => item.name)

  if (!制帽编号) {
    return call.error("制帽编号不能为空", { code: "EMPTY_HAT_MAKING_ID" })
  }
  if (!名称) {
    return call.error("制帽名称不能为空", { code: "EMPTY_HAT_MAKING_NAME" })
  }
  if (!(帽围 > 0)) {
    return call.error("帽围必须大于0", { code: "INVALID_HAT_AROUND" })
  }
  if (!(帽深 > 0)) {
    return call.error("帽深必须大于0", { code: "INVALID_HAT_DEPTH" })
  }
  if (!(前后 > 0)) {
    return call.error("前后必须大于0", { code: "INVALID_FRONT_BACK" })
  }
  if (高针图系统预置区域列表.some(item => !(item.lineLength > 0))) {
    return call.error("高针图系统预置区域列表 lineLength 必须大于0", {
      code: "INVALID_HIGH_NEEDLE_REGION_LINE_LENGTH",
    })
  }
  if (手织图系统预置区域列表.some(item => !(item.lineLength > 0))) {
    return call.error("手织图系统预置区域列表 lineLength 必须大于0", {
      code: "INVALID_HAND_WOVEN_REGION_LINE_LENGTH",
    })
  }

  const col = Global.getCollection("制帽")
  const existing = await col.findOne({ _id: 制帽编号 })
  if (existing) {
    return call.error("制帽编号已存在", { code: "DUPLICATE_HAT_MAKING_ID" })
  }

  await col.insertOne({
    _id: 制帽编号,
    名称,
    帽围,
    帽深,
    前后,
    高针图,
    手织图,
    高针图系统预置区域列表,
    手织图系统预置区域列表,
  })
  call.succ({ id: 制帽编号 })
}
