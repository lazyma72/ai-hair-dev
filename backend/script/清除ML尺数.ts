import { ObjectId } from "mongodb"
import { Global } from "../src/models/Global"

/**
 * 清除某条成品稿的机器规格清单中的 M/L 尺数，只保留 D。
 *
 * 适用场景：
 * - 纯色稿只允许 D 尺数，历史脏数据可能残留 M/L 导致前端误展示。
 */
async function 清除ML尺数() {
  await Global.init()

  const idStr = "69e794a7af0077965b93b4ad"
  if (!ObjectId.isValid(idStr)) {
    throw new Error(`非法 id: ${idStr}`)
  }

  const col = Global.getCollection("沐茵丝假发成品稿")
  const _id = new ObjectId(idStr)

  const doc = await col.findOne(
    { _id },
    { projection: { _id: 1, "制品规格书.机器规格清单": 1 } as any }
  )
  if (!doc) {
    throw new Error(`未找到文档: ${idStr}`)
  }

  const specBook: any = (doc as any).制品规格书 ?? {}
  const list: any[] = specBook.机器规格清单 ?? []

  let changed = 0
  const nextList = list.map(row => {
    const d = row?.双针?.尺数?.D
    if (d == null) return row

    const hadM = row?.双针?.尺数?.M != null
    const hadL = row?.双针?.尺数?.L != null
    if (!hadM && !hadL) return row

    changed += 1
    return {
      ...row,
      双针: {
        ...row.双针,
        尺数: { D: d },
      },
    }
  })

  if (changed === 0) {
    console.log(`[OK] 未发现需要清除的 M/L 尺数: ${idStr}`)
    return
  }

  const res = await col.updateOne({ _id }, { $set: { "制品规格书.机器规格清单": nextList } } as any)

  console.log(
    `[OK] 已清除 ${changed} 个档位的 M/L 尺数，只保留 D。matched=${res.matchedCount}, modified=${res.modifiedCount}`
  )
}

清除ML尺数().catch(e => {
  console.error(e)
  process.exitCode = 1
})
