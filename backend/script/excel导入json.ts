import path from "path"
import { promises as fs } from "fs"
import * as XLSX from "xlsx"
import type { Db胶丝比例, KLS胶丝比例 } from "../src/shared/db/Db胶丝比例"

// Excel 源文件
const excelPath = "C://Users//Administrator//Desktop//3.26颜色比例表 的副本.xlsx"

type HeaderInfo = {
  row: number
  颜色: number
  线色: number
  D: number
  M: number
  L: number
  备注?: number
}

type SheetParseStats = {
  rawDetailRows: number
  mergedColorRows: number
  usedFallbackColorRows: number
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim()
}

function normalizeHeader(value: unknown): string {
  return normalizeText(value).replace(/\s+/g, "").toUpperCase()
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

function getRawCellText(sheet: XLSX.WorkSheet, row: number, col: number): string {
  const cell = sheet[encodeCell(row, col)] as XLSX.CellObject | undefined
  if (!cell) return ""
  if (typeof cell.w === "string" && cell.w.trim()) return cell.w.trim()
  return normalizeText(cell.v)
}

function parsePercent(cell?: XLSX.CellObject): number | undefined {
  if (!cell) return undefined
  const text = normalizeText(cell.w ?? cell.v)
  if (!text) return undefined

  const cleaned = text.replace(/%/g, "").replace(/,/g, "").trim()
  if (!cleaned) return undefined

  const num = Number(cleaned)
  if (!Number.isFinite(num)) return undefined

  if (text.includes("%")) return num
  if (typeof cell.v === "number" && cell.v >= 0 && cell.v <= 1) {
    return cell.v * 100
  }
  return num
}

function parseColorTriplet(
  sheet: XLSX.WorkSheet,
  row: number,
  startCol: number
): KLS胶丝比例 | undefined {
  const 发丝 = getCellText(sheet, row, startCol + 0)
  const 色号 = getCellText(sheet, row, startCol + 1)
  const ratioCell = getCellObject(sheet, row, startCol + 2)
  const 比例 = parsePercent(ratioCell)

  if (!发丝 && !色号 && 比例 == null) return undefined
  if (!发丝 || !色号 || 比例 == null) return undefined

  return {
    发丝,
    色号,
    比例,
  }
}

function sanitizeFileName(name: string): string {
  const safe = name.replace(/[\\/:*?"<>|]/g, "_").trim()
  return safe || "未命名Sheet"
}

function findHeader(sheet: XLSX.WorkSheet): HeaderInfo | null {
  const ref = sheet["!ref"]
  if (!ref) return null
  const range = XLSX.utils.decode_range(ref)

  for (let r = range.s.r; r <= Math.min(range.e.r, range.s.r + 20); r++) {
    let 颜色 = -1
    let 线色 = -1
    let D = -1
    let M = -1
    let L = -1
    let 备注 = -1

    for (let c = range.s.c; c <= range.e.c; c++) {
      const text = normalizeHeader(getCellText(sheet, r, c))
      if (text === "颜色" && 颜色 < 0) 颜色 = c
      else if (text === "线色" && 线色 < 0) 线色 = c
      else if ((text === "D色" || text === "D") && D < 0) D = c
      else if ((text === "M色" || text === "M") && M < 0) M = c
      else if ((text === "L色" || text === "L") && L < 0) L = c
      else if (text.includes("备注") && 备注 < 0) 备注 = c
    }

    if (颜色 >= 0 && 线色 >= 0 && D >= 0 && M >= 0 && L >= 0) {
      return {
        row: r,
        颜色,
        线色,
        D,
        M,
        L,
        备注: 备注 >= 0 ? 备注 : undefined,
      }
    }
  }

  return null
}

function parseSheet(
  sheetName: string,
  sheet: XLSX.WorkSheet
): { records: Db胶丝比例[]; stats: SheetParseStats } {
  const header = findHeader(sheet)
  if (!header) {
    console.warn(`[跳过] Sheet「${sheetName}」未找到有效表头`)
    return {
      records: [],
      stats: {
        rawDetailRows: 0,
        mergedColorRows: 0,
        usedFallbackColorRows: 0,
      },
    }
  }

  const ref = sheet["!ref"]
  if (!ref) {
    return {
      records: [],
      stats: {
        rawDetailRows: 0,
        mergedColorRows: 0,
        usedFallbackColorRows: 0,
      },
    }
  }
  const range = XLSX.utils.decode_range(ref)
  const 发丝种类 = normalizeText(sheetName)

  const map = new Map<string, Db胶丝比例>()
  let lastColorCode = ""
  let usedFallbackColorRows = 0
  let rawDetailRows = 0

  for (let r = header.row + 1; r <= range.e.r; r++) {
    const 原始颜色编号 = getCellText(sheet, r, header.颜色)
    const 线色 = getCellText(sheet, r, header.线色)
    const 备注 = header.备注 != null ? getCellText(sheet, r, header.备注) : ""
    const D项 = parseColorTriplet(sheet, r, header.D)
    const M项 = parseColorTriplet(sheet, r, header.M)
    const L项 = parseColorTriplet(sheet, r, header.L)

    const hasGroupData = Boolean(D项 || M项 || L项)
    if (!原始颜色编号 && !线色 && !备注 && !hasGroupData) continue
    if (!hasGroupData) continue

    let 颜色编号 = 原始颜色编号
    if (原始颜色编号) {
      lastColorCode = 原始颜色编号
    } else if (lastColorCode) {
      颜色编号 = lastColorCode
      usedFallbackColorRows += 1
    }
    if (!颜色编号) continue

    rawDetailRows += 1

    const key = `${发丝种类}__${颜色编号}`
    const existing =
      map.get(key) ??
      ({
        _id: {
          颜色编号,
          发丝种类,
        },
        D: [],
      } satisfies Db胶丝比例)

    if (线色 && !existing.线色) existing.线色 = 线色
    if (备注 && !existing.备注) existing.备注 = 备注
    if (D项) existing.D.push(D项)
    if (M项) {
      existing.M ??= []
      existing.M.push(M项)
    }
    if (L项) {
      existing.L ??= []
      existing.L.push(L项)
    }

    map.set(key, existing)
  }

  const records = Array.from(map.values()).filter(item => item.D.length > 0)
  return {
    records,
    stats: {
      rawDetailRows,
      mergedColorRows: records.length,
      usedFallbackColorRows,
    },
  }
}

function collectMergedColorLogs(
  sheet: XLSX.WorkSheet,
  header: HeaderInfo
): Array<{ 颜色编号: string; 行数: number; 行号: number[] }> {
  const ref = sheet["!ref"]
  if (!ref) return []
  const range = XLSX.utils.decode_range(ref)
  const rowIndexesByColor = new Map<string, number[]>()

  for (let r = header.row + 1; r <= range.e.r; r++) {
    const 颜色编号 = getRawCellText(sheet, r, header.颜色)
    const 线色 = getCellText(sheet, r, header.线色)
    const 备注 = header.备注 != null ? getCellText(sheet, r, header.备注) : ""
    const D项 = parseColorTriplet(sheet, r, header.D)
    const M项 = parseColorTriplet(sheet, r, header.M)
    const L项 = parseColorTriplet(sheet, r, header.L)
    const hasGroupData = Boolean(D项 || M项 || L项)

    if (!颜色编号 && !线色 && !备注 && !hasGroupData) continue
    if (!颜色编号 || !hasGroupData) continue

    const rows = rowIndexesByColor.get(颜色编号) ?? []
    rows.push(r + 1)
    rowIndexesByColor.set(颜色编号, rows)
  }

  return Array.from(rowIndexesByColor.entries())
    .filter(([, rows]) => rows.length > 1)
    .map(([颜色编号, 行号]) => ({ 颜色编号, 行数: 行号.length, 行号 }))
    .sort((a, b) => b.行数 - a.行数 || a.颜色编号.localeCompare(b.颜色编号))
}

async function main() {
  const workbook = XLSX.readFile(path.resolve(excelPath), {
    cellStyles: true,
    cellText: true,
  })
  const outputDir = path.resolve(__dirname, "胶丝比例json")
  await fs.mkdir(outputDir, { recursive: true })

  let totalSheets = 0
  let totalRecords = 0
  let totalFallbackRows = 0

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) continue

    const header = findHeader(sheet)
    const { records, stats } = parseSheet(sheetName, sheet)
    console.log(
      `\n[${sheetName}] 有效明细行 ${stats.rawDetailRows} 条，合并后颜色 ${stats.mergedColorRows} 条`
    )
    if (stats.usedFallbackColorRows > 0) {
      console.log(
        `[${sheetName}] 使用“上方颜色编号”补全 ${stats.usedFallbackColorRows} 行（兼容有空行/无空行混排）`
      )
    }
    if (header) {
      const mergedLogs = collectMergedColorLogs(sheet, header)
      if (mergedLogs.length > 0) {
        const duplicatedRowCount = mergedLogs.reduce((sum, item) => sum + item.行数, 0)
        console.log(
          `[${sheetName}] 存在相同颜色编号的行数 ${duplicatedRowCount} 条，共 ${mergedLogs.length} 组`
        )
        console.log(
          `[${sheetName}] 重复颜色明细：${mergedLogs
            .map(item => `${item.颜色编号}(${item.行数}行@${item.行号.join(",")})`)
            .join("；")}`
        )
      }
    }

    const outputBaseName = sheetName.replace(/胶丝比例/g, "").trim()
    const outputFileName = `${sanitizeFileName(outputBaseName)}.json`
    const outputFilePath = path.join(outputDir, outputFileName)
    await fs.writeFile(outputFilePath, JSON.stringify(records, null, 2), "utf-8")
    console.log(`[${sheetName}] 已写入 ${outputFileName}，共 ${records.length} 条`)

    totalSheets += 1
    totalRecords += records.length
    totalFallbackRows += stats.usedFallbackColorRows
  }

  console.log(
    `\n✅ 导出完成：共 ${totalSheets} 个 Sheet，输出 ${totalRecords} 条记录，补全颜色编号 ${totalFallbackRows} 行`
  )
  console.log(`📁 输出目录：${outputDir}`)
}

main().catch(e => {
  console.error("❌ Excel 导入失败:", e)
  process.exit(1)
})
