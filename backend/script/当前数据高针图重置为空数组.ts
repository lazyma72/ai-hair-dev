import { ObjectId } from "mongodb"
import { Global } from "../src/models/Global"

async function main() {
  await Global.init()
  await Global.getCollection("沐茵丝假发成品稿").updateMany(
    { "高针指示单.高针图": { $exists: true } },
    {
      $set: { "高针指示单.高针图": [] },
    }
  )
  console.log("数据重置完成")
}

main().catch(e => {
  console.error(e)
  process.exitCode = 1
})
