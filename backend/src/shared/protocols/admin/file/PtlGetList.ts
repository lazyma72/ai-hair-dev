import { BaseRequest, BaseResponse, BaseConf } from "../../base"
import { 沐茵丝假发成品稿ListItem } from "../../../frontend/model/model"
import { 沐茵丝假发成品稿 } from "../../../db/Db沐茵丝假发成品稿"

export interface ReqGetList extends BaseRequest {
  /** 页码，从 1 开始 */
  pageNum?: number

  /** 每页条数 */
  pageSize?: number

  /** 搜索关键词 */
  keyword?: string

  /** 排序方式：asc/desc */
  orderSort?: "asc" | "desc"

  filter?: Partial<Pick<沐茵丝假发成品稿, "客户编号" | "品名" | "原材料" | "假发类型" | "CAP">>
}

export interface ResGetList extends BaseResponse {
  list: 沐茵丝假发成品稿ListItem[]
  total: number
  pageNum: number
  pageSize: number
}

export const conf: BaseConf = {}
