import { Global } from "../src/models/Global"
import type { 手织图 } from "../src/shared/models/手织图"

async function main() {
  const 空手织图: 手织图 = {
    json: "",
    svg: "",
    间色比例: {
      type: "特殊",
    },
  }

  await Global.init()
  await Global.getCollection("沐茵丝假发成品稿").updateMany(
    { "手织指示单.手织图": { $exists: true } },
    {
      $set: { "手织指示单.手织图": 空手织图 },
    }
  )
  console.log("数据重置完成")
}

main().catch(e => {
  console.error(e)
  process.exitCode = 1
})
