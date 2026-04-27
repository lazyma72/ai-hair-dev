import { Global } from "../models/Global"
import type { 手织图 } from "../shared/models/手织图"

async function main() {
  await Global.init()

  const 空手织图: 手织图 = {
    svg: "",
    类型: {
      type: "特殊",
    },
  }

  const col = Global.getCollection("沐茵丝假发成品稿")
  const result = await col.updateMany(
    {},
    {
      $set: {
        "手织指示单.手织图": 空手织图,
      },
    },
  )

  console.log("手织图已批量重置为空数据", {
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
  })
}

main()
  .catch((error) => {
    console.error("重置手织图失败:", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await Global.destroy()
  })
