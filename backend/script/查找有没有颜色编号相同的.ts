// 在本地 JSON 文件中查找重复的颜色编号（_id）
// 运行: npx ts-node backend/script/查找有没有颜色编号相同的.ts

import fs from "fs"
import path from "path"
import { Db胶丝比例 } from "../src/shared/db/Db胶丝比例"

async function main() {
  const jsonDir = path.join(__dirname, "绞死比例json")
  if (!fs.existsSync(jsonDir)) {
    console.error(`目录不存在: ${jsonDir}`)
    process.exit(1)
  }

  const files = fs.readdirSync(jsonDir).filter(f => f.endsWith(".json"))
  if (files.length === 0) {
    console.log(`未找到任何 JSON 文件在 ${jsonDir}`)
    process.exit(0)
  }

  // map: _id -> occurrences
  const map = new Map<string, { file: string; index: number; rec: Partial<Db胶丝比例> }[]>()

  for (const file of files) {
    const p = path.join(jsonDir, file)
    let data: unknown
    try {
      data = JSON.parse(fs.readFileSync(p, "utf-8"))
    } catch (e) {
      console.error(`解析失败: ${file}:`, e)
      continue
    }

    if (!Array.isArray(data)) {
      console.warn(`${file} 不是数组，跳过`)
      continue
    }

    ;(data as any[]).forEach((rec, i) => {
      const id = rec && (rec._id ?? rec.颜色编号 ?? "")
      if (!id) return
      const arr = map.get(id) ?? []
      arr.push({ file, index: i, rec })
      map.set(id, arr)
    })
  }

  const duplicates = [...map.entries()].filter(([, arr]) => arr.length > 1)
  if (duplicates.length === 0) {
    console.log("未在 JSON 文件中发现重复的颜色编号。")
    process.exit(0)
  }

  console.log(`在 JSON 文件中发现 ${duplicates.length} 个重复颜色编号，详情:`)
  for (const [id, occ] of duplicates) {
    console.log(`- ${id}: ${occ.length} 次`)
    for (const o of occ) {
      const preview = { _id: (o.rec as any)._id, 线色: (o.rec as any).线色 }
      console.log(`    · ${o.file} [#${o.index}] ${JSON.stringify(preview)}`)
    }
  }
  process.exit(0)
}

main().catch(e => {
  console.error("查询失败:", e)
  process.exit(1)
})
