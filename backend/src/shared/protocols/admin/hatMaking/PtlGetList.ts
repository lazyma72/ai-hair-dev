import { BaseRequest, BaseResponse, BaseConf } from "../../base"
import { Db制帽 } from "../../../db/Db制帽"

export interface ReqGetList extends BaseRequest {
  pageNum?: number
  pageSize?: number
  keyword?: string
  orderSort?: "asc" | "desc"
}

export interface ResGetList extends BaseResponse {
  list: Db制帽[]
  total: number
  pageNum: number
  pageSize: number
}

export const conf: BaseConf = {
  allowNoLogin: true,
}
