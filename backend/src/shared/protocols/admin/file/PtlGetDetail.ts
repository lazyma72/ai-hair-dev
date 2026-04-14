import { BaseRequest, BaseResponse, BaseConf } from "../../base"
import { 沐茵丝假发成品稿Frontend } from "../../../frontend/model/model"

export interface ReqGetDetail extends BaseRequest {
  id: string
}

export interface ResGetDetail extends BaseResponse {
  file: 沐茵丝假发成品稿Frontend
}

export const conf: BaseConf = {
  allowNoLogin: true,
}
