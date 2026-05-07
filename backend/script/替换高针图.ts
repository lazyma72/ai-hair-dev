/*
把目标稿件的 `高针指示单.高针图` 替换为来源稿件的高针图。

说明：
- 仅替换 `高针图`，不覆盖 `高针指示单.注意事项`
- 当前数据结构中 `高针指示单` 位于稿件根层，不在 `制品规格书` 下
*/

import { ObjectId } from "mongodb"
import { normalize高针图 } from "../src/api/admin/file/normalizeNeedleGraphs"
import { Global } from "../src/models/Global"

const targetIdStr: string = "69e794a7af0077965b93b4ad"
const sourceIdStr: string = "69e79589e2300056515cafa5"

async function main() {
  await Global.init()

  if (!ObjectId.isValid(targetIdStr)) {
    throw new Error(`非法目标稿件 _id: ${targetIdStr}`)
  }
  if (!ObjectId.isValid(sourceIdStr)) {
    throw new Error(`非法来源稿件 _id: ${sourceIdStr}`)
  }
  if (targetIdStr === sourceIdStr) {
    throw new Error("来源稿件和目标稿件不能相同")
  }

  const col = Global.getCollection("沐茵丝假发成品稿")
  const targetId = new ObjectId(targetIdStr)
  const sourceId = new ObjectId(sourceIdStr)

  const [targetDoc, sourceDoc] = await Promise.all([
    col.findOne(
      { _id: targetId },
      {
        projection: {
          _id: 1,
          样品编号: 1,
          "高针指示单.注意事项": 1,
          "高针指示单.高针图": 1,
        } as any,
      }
    ),
    col.findOne(
      { _id: sourceId },
      {
        projection: {
          _id: 1,
          样品编号: 1,
          "高针指示单.高针图": 1,
        } as any,
      }
    ),
  ])

  if (!targetDoc) {
    throw new Error(`未找到目标稿件: ${targetIdStr}`)
  }
  if (!sourceDoc) {
    throw new Error(`未找到来源稿件: ${sourceIdStr}`)
  }

  const sourceGraph = normalize高针图((sourceDoc as any).高针指示单?.高针图)
  const targetGraph = normalize高针图((targetDoc as any).高针指示单?.高针图)

  const next高针图 = JSON.parse(JSON.stringify(sourceGraph))
  const target注意事项 = String((targetDoc as any).高针指示单?.注意事项 ?? "")

  const res = await col.updateOne({ _id: targetId }, {
    $set: {
      "高针指示单.高针图": next高针图,
    },
  } as any)

  console.log(
    [
      "[OK] 高针图替换完成",
      `目标稿件: ${targetIdStr} (${(targetDoc as any).样品编号 ?? ""})`,
      `来源稿件: ${sourceIdStr} (${(sourceDoc as any).样品编号 ?? ""})`,
      `目标注意事项保留: ${target注意事项 ? "是" : "否"}`,
      `目标原车线数: ${targetGraph.车线.length}`,
      `来源车线数: ${sourceGraph.车线.length}`,
      `新车线数: ${next高针图.车线.length}`,
      `来源自动修改器数: ${(sourceGraph.自动修改器 ?? []).length}`,
      `matched=${res.matchedCount}`,
      `modified=${res.modifiedCount}`,
    ].join("\n")
  )
}

main()
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await Global.destroy()
  })
