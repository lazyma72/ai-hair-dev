import { BaseRequest, BaseResponse, BaseConf } from "../../base"

export interface ReqAdd extends BaseRequest {
  制帽编号: string
  名称: string
  帽围: number
  帽深: number
  前后: number
  帽网款式: string
  备注?: string
  imgList?: string[]
}

export interface ResAdd extends BaseResponse {
  id: string
}

export const conf: BaseConf = {}
