/**
 * 导入胶丝比例脚本
 *
 * 将 script/绞死比例json/ 下所有 JSON 文件批量 upsert 到 MongoDB 胶丝比例集合。
 * 以 _id（颜色编号）为唯一键，已存在则覆盖，不存在则插入。
 *
 * 运行方式：
 *   npx ts-node script/导入胶丝比例.ts
 */
import path from "path"
import fs from "fs"
// backConfig 内部已调用 dotenv.config()，必须最先导入以确保环境变量加载
import "../src/models/backConfig"
import { Global } from "../src/models/Global"
import { Db胶丝比例 } from "../src/shared/db/Db胶丝比例"

async function main() {
  await Global.init()

  const col = Global.getCollection("胶丝比例")
  const jsonDir = path.join(__dirname, "绞死比例json")
  const files = fs.readdirSync(jsonDir).filter(f => f.endsWith(".json"))

  if (files.length === 0) {
    console.warn("未找到任何 JSON 文件，退出。")
    process.exit(0)
  }

  let totalRecords = 0
  let totalUpserted = 0
  let totalModified = 0

  for (const file of files) {
    const filePath = path.join(jsonDir, file)
    const records: Db胶丝比例[] = JSON.parse(fs.readFileSync(filePath, "utf-8"))

    console.log(`\n[${file}] 共 ${records.length} 条`)

    const ops = records.map(record => ({
      replaceOne: {
        filter: { _id: record._id } as { _id: string },
        replacement: record,
        upsert: true,
      },
    }))

    const result = await col.bulkWrite(ops, { ordered: false })

    console.log(
      `  插入: ${result.upsertedCount}  更新: ${result.modifiedCount}  匹配: ${result.matchedCount}`
    )

    totalRecords += records.length
    totalUpserted += result.upsertedCount
    totalModified += result.modifiedCount
  }

  console.log(
    `\n✅ 全部完成。总记录: ${totalRecords}，新插入: ${totalUpserted}，更新: ${totalModified}`
  )
  process.exit(0)
}

main().catch(e => {
  console.error("❌ 导入失败:", e)
  process.exit(1)
})
