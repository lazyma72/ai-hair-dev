import type {
  沐茵丝假发成品稿,
  沐茵丝假发成品稿提交,
} from "../../db/Db沐茵丝假发成品稿";
import type { FileDraftViewModel } from "../model";

export type FileDraftPreviewDbShape = Pick<
  沐茵丝假发成品稿,
  | "样品编号"
  | "客户编号"
  | "品名"
  | "原材料"
  | "CAP"
  | "染色档位列表"
  | "制品规格书"
  | "高针指示单"
  | "手织指示单"
  | "头型图片"
>;

export function toDbPayload(value: FileDraftViewModel): 沐茵丝假发成品稿提交 {
  const { _id: _ignored, ...rest } = value;
  const payload: 沐茵丝假发成品稿提交 = structuredClone(rest);
  return payload;
}

export function toPreviewDbFile(
  value: FileDraftViewModel,
): FileDraftPreviewDbShape {
  return {
    样品编号: value.样品编号,
    客户编号: value.客户编号,
    品名: value.品名,
    原材料: value.原材料,
    CAP: value.CAP,
    染色档位列表: value.染色档位列表,
    制品规格书: value.制品规格书,
    高针指示单: value.高针指示单,
    手织指示单: value.手织指示单,
    头型图片: value.头型图片,
  };
}
