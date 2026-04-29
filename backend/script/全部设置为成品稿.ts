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
  await Global.getCollection("沐茵丝假发成品稿").updateMany(
    {},
    {
      $set: {
        tag: "成品稿",
      },
    }
  )
}

清除ML尺数().catch(e => {
  console.error(e)
  process.exitCode = 1
})
