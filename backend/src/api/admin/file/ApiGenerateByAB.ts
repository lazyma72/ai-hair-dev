import { ApiCall } from "tsrpc"
import {
  ReqGenerateByAB,
  ResGenerateByAB,
} from "../../../shared/protocols/admin/file/PtlGenerateByAB"
import { Global } from "../../../models/Global"
import { 假发类型, type 沐茵丝假发成品稿 } from "../../../shared/db/Db沐茵丝假发成品稿"
import {
  recalc人工规格清单D重量,
  recalc人工规格清单上下分重量,
  recalc人工规格清单按比例DML重量,
  recalc机器规格清单D重量,
  recalc机器规格清单上下分重量,
  recalc机器规格清单按比例DML重量,
} from "../../../shared/models/重量计算"

function buildBaseFileC(fileA: 沐茵丝假发成品稿, fileB: 沐茵丝假发成品稿): 沐茵丝假发成品稿 {
  // 通用规则：基础沿用 A，胶丝比例沿用 B
  return {
    ...fileA,
    制品规格书: {
      ...fileA.制品规格书,
      胶丝比例id: fileB.制品规格书.胶丝比例id,
    },
  }
}

function applyRulesByBColor(fileA: 沐茵丝假发成品稿, fileB: 沐茵丝假发成品稿): 沐茵丝假发成品稿 {
  const fileC = buildBaseFileC(fileA, fileB)
  return {
    ...fileC,
    制品规格书: {
      ...fileC.制品规格书,
      机器规格清单: recalc机器规格清单D重量(fileC.制品规格书.机器规格清单),
      人工规格清单: recalc人工规格清单D重量(fileC.制品规格书.人工规格清单),
    },
  }
}

function pickB间色比值(fileB: 沐茵丝假发成品稿): { D: number; M?: number; L?: number } {
  const fromMachine = fileB.制品规格书.机器规格清单.find(row => row.DML比值 != null)?.DML比值
  if (fromMachine) {
    return {
      D: fromMachine.D,
      M: fromMachine.M,
      L: fromMachine.L,
    }
  }
  return { D: 1, L: 1 }
}

function pickB上下分标记(fileB: 沐茵丝假发成品稿): { hasM: boolean; hasL: boolean } {
  const hasM = fileB.制品规格书.机器规格清单.some(row => row.双针.尺数.M != null)
  const hasL = fileB.制品规格书.机器规格清单.some(row => row.双针.尺数.L != null)
  return { hasM, hasL }
}

function applyRulesByBHighlight(
  fileA: 沐茵丝假发成品稿,
  fileB: 沐茵丝假发成品稿
): 沐茵丝假发成品稿 {
  const fileC = buildBaseFileC(fileA, fileB)
  const ratio = pickB间色比值(fileB)
  return {
    ...fileC,
    制品规格书: {
      ...fileC.制品规格书,
      机器规格清单: recalc机器规格清单按比例DML重量(fileC.制品规格书.机器规格清单, ratio),
      人工规格清单: recalc人工规格清单按比例DML重量(fileC.制品规格书.人工规格清单, ratio),
    },
  }
}

function applyRulesByBSplit(fileA: 沐茵丝假发成品稿, fileB: 沐茵丝假发成品稿): 沐茵丝假发成品稿 {
  const fileC = buildBaseFileC(fileA, fileB)
  const splitFlags = pickB上下分标记(fileB)
  // 复制一份 A 的高针图，去除 DML 区域映射与标记（如果有的话）
  //
  return {
    ...fileC,
    制品规格书: {
      ...fileC.制品规格书,
      机器规格清单: recalc机器规格清单上下分重量(fileC.制品规格书.机器规格清单, splitFlags),
      人工规格清单: recalc人工规格清单上下分重量(fileC.制品规格书.人工规格清单, splitFlags),
    },
    // TODO: 高针图 DML 区域映射与标记清理规则待补充
  }
}

export default async function (call: ApiCall<ReqGenerateByAB, ResGenerateByAB>) {
  if (call.req.fileAId === call.req.fileBId) {
    return call.error("文件A和文件B不能相同")
  }
  const [fileA, fileB] = await Promise.all([
    Global.getCollection("沐茵丝假发成品稿").findOne({ _id: call.req.fileAId }),
    Global.getCollection("沐茵丝假发成品稿").findOne({ _id: call.req.fileBId }),
  ])
  if (!fileA || !fileB) {
    return call.error("文件A或文件B不存在")
  }

  const fileC = (() => {
    switch (fileB.假发类型) {
      case 假发类型.纯色:
        return applyRulesByBColor(fileA, fileB)
      case 假发类型.间色:
        return applyRulesByBHighlight(fileA, fileB)
      case 假发类型.上下分:
        return applyRulesByBSplit(fileA, fileB)
      case 假发类型.T色:
        // TODO(B=T色): 业务规则未定义，后续补充
        return buildBaseFileC(fileA, fileB)
      default: {
        const _never: never = fileB.假发类型
        return _never
      }
    }
  })()

  call.succ({ file: fileC })
}
