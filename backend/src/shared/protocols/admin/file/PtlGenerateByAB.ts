import { BaseRequest, BaseResponse, BaseConf } from "../../base"
import { 沐茵丝假发成品稿 } from "../../../db/Db沐茵丝假发成品稿"

export interface ReqGenerateByAB extends BaseRequest {
  fileAId: string
  fileBId: string
}

export interface ResGenerateByAB extends BaseResponse {
  file: 沐茵丝假发成品稿
}

export const conf: BaseConf = {}
