import { BaseConf, BaseRequest, BaseResponse } from "../../base"
import { DbCustomer } from "../../../db/DbCustomer"

export interface ReqGetList extends BaseRequest {
  keyword?: string
}

export interface ResGetList extends BaseResponse {
  list: DbCustomer[]
}

export const conf: BaseConf = {
  allowNoLogin: true,
}
