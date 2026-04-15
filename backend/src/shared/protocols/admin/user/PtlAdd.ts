import { BaseConf, BaseRequest, BaseResponse } from "../../base"

export interface ReqAdd extends BaseRequest {
  name: string
  username: string
  password: string
}

export interface ResAdd extends BaseResponse {
  id: string
}

export const conf: BaseConf = {}
