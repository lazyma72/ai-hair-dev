import { BaseRequest, BaseResponse, BaseConf } from "../../base"
import { 胶丝比例ListItem } from "../../../frontend/model/model"
import { Db胶丝比例 } from "../../../db/Db胶丝比例"

export interface ReqGetList extends BaseRequest {
  /** 页码，从 1 开始 */
  pageNum?: number

  /** 每页条数 */
  pageSize?: number

  /** 搜索关键词 */
  keyword?: string

  /** 排序方式：asc/desc */
  orderSort?: "asc" | "desc"

  filter?: Partial<{
    颜色编号?: string
    发丝种类?: string
    线色?: string
    /* 是否包含D色配比列表 */
    D?: boolean
    /* 是否包含M色配比列表 */
    M?: boolean
    /* 是否包含L色配比列表 */
    L?: boolean
  }>
}

export interface ResGetList extends BaseResponse {
  list: 胶丝比例ListItem[]
  total: number
  pageNum: number
  pageSize: number
}

export const conf: BaseConf = {}
