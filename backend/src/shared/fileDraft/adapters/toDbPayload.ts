import type {
  沐茵丝假发成品稿,
  沐茵丝假发成品稿提交,
} from "../../db/Db沐茵丝假发成品稿"
import type { FileDraftViewModel } from "../model"

export function toDbPayload(value: FileDraftViewModel): 沐茵丝假发成品稿提交 {
  const { _id: _ignored, ...rest } = value
  return JSON.parse(JSON.stringify(rest)) as unknown as 沐茵丝假发成品稿提交
}

export function toPreviewDbFile(value: FileDraftViewModel): 沐茵丝假发成品稿 {
  return {
    ...toDbPayload(value),
    _id: value._id as never,
  } as unknown as 沐茵丝假发成品稿
}
