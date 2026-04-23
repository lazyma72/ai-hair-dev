/*
对69e794a7af0077965b93b4ad稿件高针图修改为69e79589e2300056515cafa5

说明：
- 按“把 A 修改为 B”的语义实现
- 即：将 A 稿件的 `高针指示单.高针图` 替换为 B 稿件的 `高针指示单.高针图`
*/

import { ObjectId } from "mongodb"
import { load } from "cheerio"
import { Global } from "../src/models/Global"
import { normalize高针图 } from "../src/api/admin/file/normalizeNeedleGraphs"

const targetIdStr: string = "69e794a7af0077965b93b4ad"
const sourceIdStr: string = "69e79589e2300056515cafa5"

function strip高针图DML规律标注(graph: ReturnType<typeof normalize高针图>) {
  const 文本节点 = graph?.底图?.文本节点 ?? {}
  const 原始svg = String(graph?.底图?.svg ?? "")

  let svg = 原始svg
  if (原始svg.trim()) {
    const $ = load(原始svg, { xmlMode: true })
    $('text[id^="dml_text_"]').remove()
    svg = $.xml()
  }

  return {
    ...graph,
    底图: {
      ...graph.底图,
      svg,
      文本节点: Object.fromEntries(
        Object.entries(文本节点).filter(([key]) => !String(key).startsWith("dml:"))
      ),
    },
    自定义数据: {
      ...graph.自定义数据,
      DML规则命令列表: [],
    },
  }
}

async function main() {
  await Global.init()

  if (!ObjectId.isValid(targetIdStr)) {
    throw new Error(`非法目标稿件 _id: ${targetIdStr}`)
  }
  if (!ObjectId.isValid(sourceIdStr)) {
    throw new Error(`非法来源稿件 _id: ${sourceIdStr}`)
  }
  if (targetIdStr === sourceIdStr) {
    throw new Error("来源稿件和目标稿件不能相同")
  }

  const col = Global.getCollection("沐茵丝假发成品稿")
  const targetId = new ObjectId(targetIdStr)
  const sourceId = new ObjectId(sourceIdStr)

  const [targetDoc, sourceDoc] = await Promise.all([
    col.findOne(
      { _id: targetId },
      {
        projection: {
          _id: 1,
          样品编号: 1,
          "高针指示单.高针图": 1,
        } as any,
      }
    ),
    col.findOne(
      { _id: sourceId },
      {
        projection: {
          _id: 1,
          样品编号: 1,
          "高针指示单.高针图": 1,
        } as any,
      }
    ),
  ])

  if (!targetDoc) {
    throw new Error(`未找到目标稿件: ${targetIdStr}`)
  }
  if (!sourceDoc) {
    throw new Error(`未找到来源稿件: ${sourceIdStr}`)
  }

  const sourceGraph = normalize高针图((sourceDoc as any).高针指示单?.高针图)
  const targetGraph = normalize高针图((targetDoc as any).高针指示单?.高针图)

  const beforeRegionLineCount = targetGraph.底图.区域线条.length
  const beforeLevelCount = targetGraph.底图.档位标注.length
  const beforeDmlRuleCount = targetGraph.自定义数据.DML规则命令列表.length

  const nextGraph = strip高针图DML规律标注(normalize高针图(JSON.parse(JSON.stringify(sourceGraph))))

  const res = await col.updateOne(
    { _id: targetId },
    {
      $set: { "高针指示单.高针图": nextGraph },
    }
  )

  console.log(
    [
      "[OK] 高针图复制完成",
      `目标稿件: ${targetIdStr} (${(targetDoc as any).样品编号 ?? ""})`,
      `来源稿件: ${sourceIdStr} (${(sourceDoc as any).样品编号 ?? ""})`,
      `目标原区域线条数: ${beforeRegionLineCount}`,
      `目标原档位数: ${beforeLevelCount}`,
      `目标原DML规则数: ${beforeDmlRuleCount}`,
      `新区域线条数: ${nextGraph.底图.区域线条.length}`,
      `新档位数: ${nextGraph.底图.档位标注.length}`,
      `新DML规则数: ${nextGraph.自定义数据.DML规则命令列表.length}`,
      `新DML文本节点数: ${
        Object.keys(nextGraph.底图.文本节点 ?? {}).filter(key => String(key).startsWith("dml:"))
          .length
      }`,
      `matched=${res.matchedCount}`,
      `modified=${res.modifiedCount}`,
    ].join("\n")
  )
}

main().catch(e => {
  console.error(e)
  process.exitCode = 1
})
