import { BaseRequest, BaseResponse, BaseConf } from "../../base"
import { 沐茵丝假发成品稿Frontend } from "../../../frontend/model/model"
import { 沐茵丝假发成品稿 } from "../../../db/Db沐茵丝假发成品稿"

export interface ReqGetDetail extends BaseRequest {
  id: string
}

export interface ResGetDetail extends BaseResponse {
  file: 沐茵丝假发成品稿Frontend
  rawFile: 沐茵丝假发成品稿
}

export const conf: BaseConf = {}
