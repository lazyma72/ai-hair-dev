import type { 沐茵丝假发成品稿 } from "../../db/Db沐茵丝假发成品稿";
import type { FileDraftViewModel } from "../model";

export function toDbPayload(value: FileDraftViewModel): 沐茵丝假发成品稿 {
  return JSON.parse(JSON.stringify(value)) as 沐茵丝假发成品稿;
}
