import fs from "fs"
import path from "path"
import { ObjectId } from "mongodb"
import { Global } from "../src/models/Global"
import type { 沐茵丝假发成品稿, 沐茵丝假发成品稿提交 } from "../src/shared/db/Db沐茵丝假发成品稿"
import type { Db胶丝比例 } from "../src/shared/db/Db胶丝比例"
import { validateFileInput } from "../src/api/admin/hatMaking/fileValidation"
import { normalize染色档位列表 } from "../src/api/admin/file/normalizeDyeLevels"
import { normalize手织图, normalize高针图 } from "../src/api/admin/file/normalizeNeedleGraphs"

const FIXED_HAIR_TYPE = "KL-S"

function getJsonPath(): string {
  const cliPath = process.argv[2]?.trim()
  if (cliPath) {
    return path.resolve(cliPath)
  }
  return path.join(__dirname, "完整规格数据.json")
}

function getHatMakingIdFromCAP(cap: string): string {
  return cap.trim().match(/^[^（(\s]+/)?.[0] ?? ""
}

function parseDocs(rawJson: unknown): any[] {
  if (Array.isArray(rawJson)) return rawJson

  if (rawJson && typeof rawJson === "object" && "沐茵丝假发成品稿" in rawJson) {
    const rawData = (rawJson as any).沐茵丝假发成品稿
    return Array.isArray(rawData) ? rawData : [rawData]
  }

  throw new Error("JSON 结构无法识别，既不是数组也没有 沐茵丝假发成品稿 字段")
}

function buildDefault工程重量() {
  return {
    整毛: { 加减: 0 },
    双针: { 加减: 0 },
    美容: { 加减: 0 },
    制帽: { 加减: 0 },
    手织: { 加减: 0 },
    高针: { 加减: 0 },
    剪驳: { 加减: 0 },
    发网: { 加减: 0 },
    完成: { 加减: 0 },
  }
}

function normalizeImportedFile(raw: any): 沐茵丝假发成品稿提交 {
  const 颜色编号 = "TT8/10613"
  const 文件名称 = String(raw?.文件名称 ?? "").trim() || undefined
  const normalizedInput = {
    ...raw,
    文件名称,
    tag: raw?.tag ?? "成品稿",
    染色档位列表: normalize染色档位列表(raw?.染色档位列表),
    高针指示单: {
      注意事项: String(raw?.高针指示单?.注意事项 ?? ""),
      高针图: normalize高针图(raw?.高针指示单?.高针图),
    },
    手织指示单: {
      注意事项: String(raw?.手织指示单?.注意事项 ?? ""),
      手织图: normalize手织图(raw?.手织指示单?.手织图),
    },
    头型图片: Array.isArray(raw?.头型图片) ? raw.头型图片 : [],
    制品规格书: {
      ...raw?.制品规格书,
      机器规格清单: Array.isArray(raw?.制品规格书?.机器规格清单) ? raw.制品规格书.机器规格清单 : [],
      人工规格清单: Array.isArray(raw?.制品规格书?.人工规格清单) ? raw.制品规格书.人工规格清单 : [],
      胶丝比例id: {
        颜色编号,
        发丝种类: FIXED_HAIR_TYPE,
      },
      制帽: {
        唛头: String(raw?.制品规格书?.制帽?.唛头 ?? ""),
      },
      工程重量: {
        ...buildDefault工程重量(),
        ...(raw?.制品规格书?.工程重量 ?? {}),
      },
    },
  }

  const validation = validateFileInput(normalizedInput)
  if (!validation.ok) {
    const sampleNo = String(raw?.样品编号 ?? "").trim() || "未知样品"
    throw new Error(`[${sampleNo}] ${validation.message}`)
  }

  return {
    ...validation.file,
    文件名称,
    制品规格书: {
      ...validation.file.制品规格书,
      制帽: {
        唛头: validation.file.制品规格书?.制帽?.唛头 ?? "",
      },
      工程重量: {
        ...buildDefault工程重量(),
        ...(validation.file.制品规格书?.工程重量 ?? {}),
      },
    },
  }
}

async function ensure胶丝比例存在(file: 沐茵丝假发成品稿提交) {
  const 胶丝比例id = file.制品规格书?.胶丝比例id
  const 颜色编号 = String(胶丝比例id?.颜色编号 ?? "").trim()
  const 发丝种类 = String(胶丝比例id?.发丝种类 ?? "").trim()

  if (!颜色编号 || !发丝种类) {
    console.warn(`跳过胶丝比例占位创建：${file.样品编号} 缺少颜色编号或发丝种类`)
    return
  }

  const col = Global.getCollection("胶丝比例")
  const existing = await col.findOne({
    _id: { 颜色编号, 发丝种类 },
  })

  if (existing) return

  const placeholder: Db胶丝比例 = {
    _id: { 颜色编号, 发丝种类 },
    D: [],
  }
  await col.insertOne(placeholder)
  console.log(`已创建胶丝比例占位记录: ${颜色编号} / ${发丝种类}`)
}

async function warnMissingReferences(file: 沐茵丝假发成品稿提交) {
  const customerCol = Global.getCollection("客户")
  const customer = await customerCol.findOne({ _id: file.客户编号 })
  if (!customer) {
    console.warn(`客户编号不存在，仅提示不阻断导入: ${file.客户编号}`)
  }

  const hatMakingId = getHatMakingIdFromCAP(file.CAP)
  if (!hatMakingId) {
    console.warn(`CAP 无法识别制帽编号，仅提示不阻断导入: ${file.CAP}`)
    return
  }

  const hatMakingCol = Global.getCollection("制帽")
  const hatMaking = await hatMakingCol.findOne({ _id: hatMakingId })
  if (!hatMaking) {
    console.warn(`CAP 关联制帽不存在，仅提示不阻断导入: ${hatMakingId}`)
  }
}

async function upsertFile(file: 沐茵丝假发成品稿提交) {
  const col = Global.getCollection("沐茵丝假发成品稿")
  const now = new Date()
  const uniqueFilter = {
    样品编号: file.样品编号,
    "制品规格书.胶丝比例id.颜色编号": file.制品规格书.胶丝比例id.颜色编号,
    "制品规格书.胶丝比例id.发丝种类": file.制品规格书.胶丝比例id.发丝种类,
  }

  const existing = await col.findOne(uniqueFilter, {
    projection: {
      _id: 1,
      createTime: 1,
    },
  })

  const docToSave: 沐茵丝假发成品稿 = {
    ...file,
    文件名称: file.文件名称,
    _id: existing?._id ?? new ObjectId(),
    tag: file.tag ?? "成品稿",
    createTime: existing?.createTime ?? now,
    updateTime: now,
  }

  await col.replaceOne({ _id: docToSave._id }, docToSave, { upsert: true })
  return existing ? "updated" : "inserted"
}

async function main() {
  const jsonPath = getJsonPath()
  console.log(`读取文件: ${jsonPath}`)

  const rawJson = JSON.parse(fs.readFileSync(jsonPath, "utf-8"))
  const docs = parseDocs(rawJson)
  console.log(`识别到 ${docs.length} 条待导入数据`)

  await Global.init()

  let insertedCount = 0
  let updatedCount = 0

  try {
    for (const rawDoc of docs) {
      const file = normalizeImportedFile(rawDoc)
      await ensure胶丝比例存在(file)
      await warnMissingReferences(file)
      const action = await upsertFile(file)
      if (action === "inserted") insertedCount += 1
      else updatedCount += 1
      console.log(`已导入: ${file.样品编号} (${action})`)
    }

    console.log(`导入完成，新增 ${insertedCount} 条，更新 ${updatedCount} 条`)
  } finally {
    await Global.destroy()
  }
}

main().catch(error => {
  console.error("导入失败:", error)
  process.exit(1)
})
