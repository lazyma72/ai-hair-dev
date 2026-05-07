import type { 沐茵丝假发成品稿 } from "../../db/Db沐茵丝假发成品稿";
import type { FileDraftViewModel } from "../model";

export function fromDbToFileDraftViewModel(
  value: 沐茵丝假发成品稿,
): FileDraftViewModel {
  const { _id, ...rest } = value;

  return {
    ...structuredClone(rest),
    _id: String(_id ?? ""),
  };
}
