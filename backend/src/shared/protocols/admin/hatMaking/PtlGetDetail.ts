import { BaseRequest, BaseResponse, BaseConf } from "../../base"
import { Db制帽 } from "../../../db/Db制帽"

export interface ReqGetDetail extends BaseRequest {
  id: string
}

export interface ResGetDetail extends BaseResponse {
  制帽: Db制帽
}

export const conf: BaseConf = {
  allowNoLogin: true,
}
