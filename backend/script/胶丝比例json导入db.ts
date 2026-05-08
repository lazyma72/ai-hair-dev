import path from "path"
import { promises as fs } from "fs"
import "../src/models/backConfig"
import { Global } from "../src/models/Global"
import type { Db胶丝比例 } from "../src/shared/db/Db胶丝比例"

function normalizeHairType(value: string): string {
	return value.replace(/胶丝比例/g, "").trim()
}

async function main() {
	await Global.init()

	const col = Global.getCollection("胶丝比例")
	const jsonDir = path.resolve(__dirname, "胶丝比例json")

	const allFiles = (await fs.readdir(jsonDir)).filter(name => name.toLowerCase().endsWith(".json"))
	const files = allFiles.filter(name => !name.includes("重复"))
	const skippedFiles = allFiles.filter(name => name.includes("重复"))

	if (files.length === 0) {
		console.warn("未找到可导入的 JSON 文件，任务结束。")
		return
	}

	if (skippedFiles.length > 0) {
		console.log(`跳过重复 Sheet 文件：${skippedFiles.join("、")}`)
	}

	const deleted = await col.deleteMany({})
	console.log(`已清空胶丝比例集合，删除 ${deleted.deletedCount} 条旧数据`)

	let totalInserted = 0
	let totalFiles = 0

	for (const fileName of files) {
		const filePath = path.join(jsonDir, fileName)
		const rawText = await fs.readFile(filePath, "utf-8")
		const rawData = JSON.parse(rawText) as Db胶丝比例[]

		if (!Array.isArray(rawData)) {
			console.warn(`[${fileName}] 不是数组结构，已跳过`)
			continue
		}

		const normalized = rawData
			.map(item => {
				const colorCode = item?._id?.颜色编号?.trim()
				if (!colorCode) return null
				return {
					...item,
					_id: {
						颜色编号: colorCode,
						发丝种类: normalizeHairType(item._id.发丝种类 || fileName.replace(/\.json$/i, "")),
					},
				} satisfies Db胶丝比例
			})
			.filter((item): item is Db胶丝比例 => Boolean(item))

		if (normalized.length === 0) {
			console.log(`[${fileName}] 无有效数据，跳过`)
			continue
		}

		const result = await col.insertMany(normalized, { ordered: false })
		totalInserted += result.insertedCount
		totalFiles += 1
		console.log(`[${fileName}] 导入 ${result.insertedCount} 条`)
	}

	console.log(`\n✅ 导入完成：处理 ${totalFiles} 个文件，新增 ${totalInserted} 条`)
}

main()
	.catch(err => {
		console.error("❌ 导入失败:", err)
		process.exit(1)
	})
	.finally(async () => {
		await Global.destroy()
	})
