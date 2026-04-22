import fs from "fs"
import path from "path"
import { ObjectId } from "mongodb"
import { Global } from "../src/models/Global"
import { 沐茵丝假发成品稿 } from "../src/shared/db/Db沐茵丝假发成品稿"
import type { Db胶丝比例 } from "../src/shared/db/Db胶丝比例"

async function main() {
  await Global.init()

  const jsonPath = path.join(__dirname, "完整规格数据.json")

  console.log(`读取文件: ${jsonPath}`)
  const rawJson = JSON.parse(fs.readFileSync(jsonPath, "utf-8"))

  // 兼容两种数据结构：
  // 1. 直接是成品稿数组
  // 2. 包了一层 { "沐茵丝假发成品稿": [ ... ] } 或者 { "沐茵丝假发成品稿": { ... } }
  let docs: any[]

  if (Array.isArray(rawJson)) {
    docs = rawJson
  } else if (rawJson.沐茵丝假发成品稿) {
    const rawData = rawJson.沐茵丝假发成品稿
    docs = Array.isArray(rawData) ? rawData : [rawData]
  } else {
    throw new Error("JSON 结构无法识别，既不是数组也没有沐茵丝假发成品稿 字段")
  }

  console.log(`共 ${docs.length} 条文档待导入`)

  // 先插入胶丝比例记录（颜色编号 179-A，发丝种类 ECO+FU）
  const 胶丝比例Col = Global.getCollection("胶丝比例")
  const 胶丝比例Id = {
    颜色编号: "179-A",
    发丝种类: "ECO+FU",
  }

  // 检查是否已存在，不存在则插入
  const existing = await 胶丝比例Col.findOne({ _id: 胶丝比例Id })
  if (!existing) {
    const default胶丝比例: Db胶丝比例 = {
      _id: 胶丝比例Id,
      D: [], // 这里暂时留空，你可以根据实际数据补充
    }
    await 胶丝比例Col.insertOne(default胶丝比例)
    console.log("已插入胶丝比例记录:", 胶丝比例Id)
  } else {
    console.log("胶丝比例记录已存在:", 胶丝比例Id)
  }

  // 把字符串 _id 转成 ObjectId，并修复缺失字段
  const normalizedDocs: 沐茵丝假发成品稿[] = docs.map((doc: any) => {
    const { _id, ...rest } = doc
    const oid: ObjectId = new ObjectId()

    const normalized = { ...rest } as any

    // 写死客户编号
    normalized.客户编号 = "XM"

    // 写死 CAP（制帽编号）
    normalized.CAP = "P-006"

    // 写死制帽.唛头
    if (!normalized.制品规格书) {
      normalized.制品规格书 = {}
    }
    if (!normalized.制品规格书.制帽) {
      normalized.制品规格书.制帽 = {}
    }
    normalized.制品规格书.制帽.唛头 = "2个标"

    // 关联胶丝比例id
    normalized.制品规格书.胶丝比例id = 胶丝比例Id

    // 修复机器规格清单缺失 整毛.拉尖 的问题
    if (normalized.制品规格书?.机器规格清单) {
      normalized.制品规格书.机器规格清单 = normalized.制品规格书.机器规格清单.map((row: any) => {
        if (!row.整毛) {
          row.整毛 = { 拉尖: 0 }
        } else if (typeof row.整毛 === "object" && row.整毛.拉尖 == null) {
          row.整毛.拉尖 = 0
        }
        return row
      })
    }

    // 修复人工规格清单缺失 整毛.拉尖 的问题
    if (normalized.制品规格书?.人工规格清单) {
      normalized.制品规格书.人工规格清单 = normalized.制品规格书.人工规格清单.map((row: any) => {
        if (!row.整毛) {
          row.整毛 = { 拉尖: 0 }
        } else if (typeof row.整毛 === "object" && row.整毛.拉尖 == null) {
          row.整毛.拉尖 = 0
        }
        return row
      })
    }

    return {
      ...normalized,
      _id: oid,
    } as unknown as 沐茵丝假发成品稿
  })

  const col = Global.getCollection("沐茵丝假发成品稿")

  //   // 清空表（可选，根据需要注释）
  //   console.log("清空现有数据...")
  //   await col.deleteMany({})

  console.log("开始导入...")
  const result = await col.insertMany(normalizedDocs)

  console.log(`导入成功，共 ${result.insertedCount} 条`)
  console.log(
    "Inserted IDs:",
    Object.values(result.insertedIds).map(id => id.toHexString())
  )
}

main().catch(err => {
  console.error("导入失败:", err)
  process.exit(1)
})
