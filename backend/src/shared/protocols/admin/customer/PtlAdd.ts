import { BaseConf, BaseRequest, BaseResponse } from "../../base"

export interface ReqAdd extends BaseRequest {
  客户编号: string
}

export interface ResAdd extends BaseResponse {
  id: string
}

export const conf: BaseConf = {}
