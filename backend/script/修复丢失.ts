import { ObjectId } from "mongodb"
import { Global } from "../src/models/Global"

/**
 * 修复错误数据：将缺失的 `制品规格书.人工规格清单.*.裁断与重量.*.重量g.D` 补为 0。
 *
 * 触发错误示例：
 * Property `file.制品规格书.人工规格清单.0.裁断与重量.0.重量g`: Missing required property `D`.
 */
async function main() {
  await Global.init()

  const idStr = "69e794a7af0077965b93b4ad"
  if (!ObjectId.isValid(idStr)) {
    throw new Error(`非法 _id: ${idStr}`)
  }

  const col = Global.getCollection("沐茵丝假发成品稿")
  const _id = new ObjectId(idStr)

  const doc = await col.findOne(
    { _id },
    { projection: { _id: 1, "制品规格书.人工规格清单": 1 } as any }
  )
  if (!doc) {
    throw new Error(`未找到文档: ${idStr}`)
  }

  const specBook: any = (doc as any).制品规格书 ?? {}
  const list: any[] = specBook.人工规格清单 ?? []

  let fixedCount = 0
  const nextList = list.map(row => {
    const cuts: any[] = row?.裁断与重量 ?? []
    const nextCuts = cuts.map(cut => {
      const weight = cut?.重量g
      if (weight && typeof weight === "object" && weight.D == null) {
        fixedCount += 1
        return {
          ...cut,
          重量g: {
            ...weight,
            D: 0,
          },
        }
      }
      return cut
    })

    // 仅当发生变化时替换，减少无意义写回
    if (nextCuts !== cuts) {
      return { ...row, 裁断与重量: nextCuts }
    }
    return row
  })

  if (fixedCount === 0) {
    console.log(`[OK] 未发现缺失 D 的 重量g，文档无需修复: ${idStr}`)
    return
  }

  const res = await col.updateOne({ _id }, { $set: { "制品规格书.人工规格清单": nextList } } as any)

  console.log(
    `[OK] 已修复 ${fixedCount} 处缺失的 重量g.D -> 0，matched=${res.matchedCount}, modified=${res.modifiedCount}`
  )
}

main().catch(e => {
  console.error(e)
  process.exitCode = 1
})
