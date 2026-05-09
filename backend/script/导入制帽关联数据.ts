import * as XLSX from "xlsx"
import { Global } from "../src/models/Global"
import type { Db制帽线色关联表 } from "../src/shared/db/Db制帽线色关联表"

const EXCEL_PATH = "/Users/bytedance/Documents/3.26颜色比例表.xlsx"
const TARGET_SHEETS = ["HL+FU", "LF+FU"] as const
const TARGET_HAT_IDS = ["P-009", "P-005", "P-055"] as const

type TargetSheetName = (typeof TARGET_SHEETS)[number]

type LineColorItem = {
  颜色编号: string
  发丝种类: TargetSheetName
  线色: string
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim()
}

function encodeCell(r: number, c: number): string {
  return XLSX.utils.encode_cell({ r, c })
}

function findMergeStart(sheet: XLSX.WorkSheet, row: number, col: number): { r: number; c: number } {
  const merges = (sheet["!merges"] ?? []) as XLSX.Range[]
  const hit = merges.find(m => row >= m.s.r && row <= m.e.r && col >= m.s.c && col <= m.e.c)
  return hit ? { r: hit.s.r, c: hit.s.c } : { r: row, c: col }
}

function getCellObject(
  sheet: XLSX.WorkSheet,
  row: number,
  col: number
): XLSX.CellObject | undefined {
  const start = findMergeStart(sheet, row, col)
  return sheet[encodeCell(start.r, start.c)] as XLSX.CellObject | undefined
}

function getCellText(sheet: XLSX.WorkSheet, row: number, col: number): string {
  const cell = getCellObject(sheet, row, col)
  if (!cell) return ""
  if (typeof cell.w === "string" && cell.w.trim()) return cell.w.trim()
  return normalizeText(cell.v)
}

function parseSheet(sheetName: TargetSheetName, sheet: XLSX.WorkSheet): LineColorItem[] {
  const ref = sheet["!ref"]
  if (!ref) return []

  const range = XLSX.utils.decode_range(ref)
  const map = new Map<string, LineColorItem>()
  let lastColorCode = ""

  for (let r = range.s.r; r <= range.e.r; r++) {
    const rawColorCode = getCellText(sheet, r, 0)
    const rawThreadColor = getCellText(sheet, r, 1)

    const colorCode = normalizeText(rawColorCode)
    const threadColor = normalizeText(rawThreadColor)

    if (colorCode === "颜色" || colorCode === "颜色编号") continue
    if (threadColor === "线色") continue

    if (!colorCode && !threadColor) continue

    const resolvedColorCode = colorCode || lastColorCode
    if (!resolvedColorCode) continue
    if (colorCode) lastColorCode = colorCode
    if (!threadColor) continue

    const existing = map.get(resolvedColorCode)
    if (existing && existing.线色 !== threadColor) {
      console.warn(
        `[${sheetName}] 颜色编号 ${resolvedColorCode} 存在线色冲突：保留后值 ${threadColor}，原值 ${existing.线色}`
      )
    }

    map.set(resolvedColorCode, {
      颜色编号: resolvedColorCode,
      发丝种类: sheetName,
      线色: threadColor,
    })
  }

  return Array.from(map.values())
}

async function ensureTargetHatsExist() {
  const hatCol = Global.getCollection("制帽")
  const hats = await hatCol
    .find({ _id: { $in: [...TARGET_HAT_IDS] } })
    .project({ _id: 1 })
    .toArray()
  const existingHatIds = new Set(hats.map(item => item._id))
  const missingHatIds = TARGET_HAT_IDS.filter(id => !existingHatIds.has(id))
  if (missingHatIds.length > 0) {
    throw new Error(`以下制帽不存在：${missingHatIds.join("、")}`)
  }
}

async function filterExistingRatioItems(items: LineColorItem[]): Promise<LineColorItem[]> {
  if (items.length === 0) return []

  const ratioCol = Global.getCollection("胶丝比例")
  const ratios = await ratioCol
    .find({
      $or: items.map(item => ({
        "_id.颜色编号": item.颜色编号,
        "_id.发丝种类": item.发丝种类,
      })),
    })
    .project({ "_id.颜色编号": 1, "_id.发丝种类": 1 })
    .toArray()

  const existingKeys = new Set(ratios.map(item => `${item._id.发丝种类}__${item._id.颜色编号}`))

  return items.filter(item => {
    const key = `${item.发丝种类}__${item.颜色编号}`
    const exists = existingKeys.has(key)
    if (!exists) {
      console.warn(`跳过不存在的胶丝比例：${item.发丝种类} / ${item.颜色编号}`)
    }
    return exists
  })
}

function buildRelations(items: LineColorItem[]): Db制帽线色关联表[] {
  return items.flatMap(item =>
    TARGET_HAT_IDS.map(hatId => ({
      _id: {
        颜色编号: item.颜色编号,
        发丝种类: item.发丝种类,
        制帽id: hatId,
      },
      线色: item.线色,
    }))
  )
}

async function main() {
  console.log(`读取 Excel: ${EXCEL_PATH}`)
  const workbook = XLSX.readFile(EXCEL_PATH, {
    cellStyles: true,
    cellText: true,
  })

  const parsedItems: LineColorItem[] = []
  for (const sheetName of TARGET_SHEETS) {
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) {
      console.warn(`跳过缺失 sheet：${sheetName}`)
      continue
    }

    const items = parseSheet(sheetName, sheet)
    parsedItems.push(...items)
    console.log(`[${sheetName}] 读取到 ${items.length} 条 颜色编号-线色 映射`)
  }

  await Global.init()

  try {
    await ensureTargetHatsExist()

    const validItems = await filterExistingRatioItems(parsedItems)
    const relations = buildRelations(validItems)
    const relationCol = Global.getCollection("制帽线色关联表")

    await relationCol.deleteMany({
      "_id.发丝种类": { $in: [...TARGET_SHEETS] },
      "_id.制帽id": { $in: [...TARGET_HAT_IDS] },
    })

    if (relations.length > 0) {
      await relationCol.insertMany(relations)
    }

    console.log(
      `导入完成：共写入 ${relations.length} 条制帽线色关联（${validItems.length} 个颜色编号 x ${TARGET_HAT_IDS.length} 个制帽）`
    )
  } finally {
    await Global.destroy()
  }
}

main().catch(error => {
  console.error("导入制帽关联数据失败:", error)
  process.exit(1)
})
