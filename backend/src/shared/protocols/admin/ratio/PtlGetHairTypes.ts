import { BaseRequest, BaseResponse, BaseConf } from "../../base"

export interface ReqGetHairTypes extends BaseRequest {}

export interface ResGetHairTypes extends BaseResponse {
  list: string[]
}

export const conf: BaseConf = {}
