import { BaseConf, BaseRequest, BaseResponse } from "../../base"

export interface ReqDelete extends BaseRequest {
  id: string
}

export interface ResDelete extends BaseResponse {}

export const conf: BaseConf = {}
