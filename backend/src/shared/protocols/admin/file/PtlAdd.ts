import { BaseRequest, BaseResponse, BaseConf } from "../../base"
import { 沐茵丝假发成品稿提交 } from "../../../db/Db沐茵丝假发成品稿"

export interface ReqAdd extends BaseRequest {
  file: 沐茵丝假发成品稿提交
}

export interface ResAdd extends BaseResponse {
  id: string
}

export const conf: BaseConf = {}
