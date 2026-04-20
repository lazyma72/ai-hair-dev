import { BaseRequest, BaseResponse, BaseConf } from "../../base"

export interface ReqAdd extends BaseRequest {
  制帽编号: string
  名称: string
  帽围: number
  帽深: number
  前后: number
  高针图?: string
  手织图?: string
  高针图系统预置区域列表: {
    name: string
    lineLength: number
  }[]
  手织图系统预置区域列表: {
    name: string
    lineLength: number
  }[]
}

export interface ResAdd extends BaseResponse {
  id: string
}

export const conf: BaseConf = {}
