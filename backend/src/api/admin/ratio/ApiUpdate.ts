import { ApiCall } from "tsrpc"
import { ReqUpdate, ResUpdate } from "../../../shared/protocols/admin/ratio/PtlUpdate"
import { Global } from "../../../models/Global"

export default async function (call: ApiCall<ReqUpdate, ResUpdate>) {
  const 颜色编号 = call.req.颜色编号?.trim()
  const 发丝种类 = call.req.发丝种类?.trim()
  const 默认线色 = call.req.默认线色?.trim() || undefined
  const 备注 = call.req.备注?.trim() || undefined
  const 制帽线色列表 = (call.req.制帽线色列表 ?? []).map(item => ({
    制帽id: item.制帽id?.trim() ?? "",
    线色: item.线色?.trim() ?? "",
    备注: item.备注?.trim() || undefined,
  }))

  if (!颜色编号 || !发丝种类) {
    return call.error("颜色编号和发丝种类不能为空", { code: "INVALID_PARAMS" })
  }

  const duplicateHatIds = new Set<string>()
  const seenHatIds = new Set<string>()
  for (const item of 制帽线色列表) {
    if (!item.制帽id) {
      return call.error("制帽编号不能为空", { code: "EMPTY_HAT_MAKING_ID" })
    }
    if (!item.线色) {
      return call.error(`制帽「${item.制帽id}」的覆盖线色不能为空`, {
        code: "EMPTY_THREAD_COLOR",
      })
    }
    if (seenHatIds.has(item.制帽id)) {
      duplicateHatIds.add(item.制帽id)
    }
    seenHatIds.add(item.制帽id)
  }
  if (duplicateHatIds.size > 0) {
    return call.error(`制帽编号重复：${Array.from(duplicateHatIds).join("、")}`, {
      code: "DUPLICATE_HAT_MAKING_ID",
    })
  }

  const ratioCol = Global.getCollection("胶丝比例")
  const relationCol = Global.getCollection("制帽线色关联表")
  const hatMakingCol = Global.getCollection("制帽")

  const ratio = await ratioCol.findOne({
    "_id.颜色编号": 颜色编号,
    "_id.发丝种类": 发丝种类,
  })
  if (!ratio) {
    return call.error("找不到对应的胶丝比例", { code: "NOT_FOUND" })
  }

  const hatIds = 制帽线色列表.map(item => item.制帽id)
  if (hatIds.length > 0) {
    const hats = await hatMakingCol
      .find({ _id: { $in: hatIds } })
      .project({ _id: 1 })
      .toArray()
    const existingHatIds = new Set(hats.map(item => item._id))
    const missingHatIds = hatIds.filter(item => !existingHatIds.has(item))
    if (missingHatIds.length > 0) {
      return call.error(`以下制帽不存在：${missingHatIds.join("、")}`, {
        code: "INVALID_HAT_MAKING_ID",
      })
    }
  }

  const $set: Partial<{ 线色: string; 备注: string }> = {}
  const $unset: Partial<Record<"线色" | "备注", 1>> = {}
  if (默认线色) {
    $set.线色 = 默认线色
  } else {
    $unset.线色 = 1
  }
  if (备注) {
    $set.备注 = 备注
  } else {
    $unset.备注 = 1
  }

  await ratioCol.updateOne(
    {
      "_id.颜色编号": 颜色编号,
      "_id.发丝种类": 发丝种类,
    },
    {
      ...(Object.keys($set).length > 0 ? { $set } : {}),
      ...(Object.keys($unset).length > 0 ? { $unset } : {}),
    }
  )

  await relationCol.deleteMany({
    "_id.颜色编号": 颜色编号,
    "_id.发丝种类": 发丝种类,
  })

  if (制帽线色列表.length > 0) {
    await relationCol.insertMany(
      制帽线色列表.map(item => ({
        _id: {
          颜色编号,
          发丝种类,
          制帽id: item.制帽id,
        },
        线色: item.线色,
        备注: item.备注,
      }))
    )
  }

  call.succ({})
}
