import type { 沐茵丝假发成品稿 } from "../../db/Db沐茵丝假发成品稿";
import type { FileDraftViewModel } from "../model";

export function fromDbToFileDraftViewModel(
  value: 沐茵丝假发成品稿,
): FileDraftViewModel {
  return {
    ...(JSON.parse(JSON.stringify(value)) as Omit<FileDraftViewModel, "_id">),
    _id: String((value as any)?._id?.toHexString?.() ?? value._id ?? ""),
  };
}
