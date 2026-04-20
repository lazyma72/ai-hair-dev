import { ApiCall } from "tsrpc"
import {
  ReqGenerateByAB,
  ResGenerateByAB,
} from "../../../shared/protocols/admin/file/PtlGenerateByAB"
import { Global } from "../../../models/Global"

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
  /* 
A 稿纯色 + B 稿纯色

A 稿纯色 + B 稿间色

A 稿纯色 + B 稿上下分

A 稿纯色 + B 稿 T 色


A 稿间色 + B 稿纯色

A 稿间色 + B 稿间色

A 稿间色 + B 稿上下分

A 稿间色 + B 稿 T 色


A 稿上下分 + B 稿纯色

A 稿上下分 + B 稿间色

A 稿上下分 + B 稿上下分

A 稿上下分 + B 稿 T 色


A 稿 T 色 + B 稿纯色

A 稿 T 色 + B 稿间色

A 稿 T 色 + B 稿上下分

A 稿 T 色 + B 稿 T 色
  */
}
