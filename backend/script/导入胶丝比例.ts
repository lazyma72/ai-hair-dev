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

  await col.deleteMany({})

  for (const file of files) {
    const filePath = path.join(jsonDir, file)
    const 发丝种类 = file.replace(/\.json$/i, "")
    const raw: (Omit<Db胶丝比例, "_id"> & { _id: string })[] = JSON.parse(
      fs.readFileSync(filePath, "utf-8")
    )

    console.log(`\n[${file}] 发丝种类=${发丝种类}，共 ${raw.length} 条`)

    const records: Db胶丝比例[] = raw.map(r => ({
      ...r,
      _id: { 颜色编号: r._id, 发丝种类 },
    }))

    let fileUpserted = 0
    let fileModified = 0

    for (const record of records) {
      const result = await col.replaceOne({ _id: record._id }, record, { upsert: true })
      if (result.upsertedCount) {
        fileUpserted++
      } else if (result.modifiedCount) {
        fileModified++
        console.log(`  [更新] ${JSON.stringify(record._id)}`)
      }
    }

    console.log(`  插入: ${fileUpserted}  更新: ${fileModified}`)

    totalRecords += records.length
    totalUpserted += fileUpserted
    totalModified += fileModified
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
