import { BaseRequest, BaseResponse, BaseConf } from "../../base"

export interface 制帽线色输入 {
  制帽id: string
  线色: string
  备注?: string
}

export interface ReqUpdate extends BaseRequest {
  颜色编号: string
  发丝种类: string
  默认线色?: string
  备注?: string
  制帽线色列表: 制帽线色输入[]
}

export interface ResUpdate extends BaseResponse {}

export const conf: BaseConf = {}
