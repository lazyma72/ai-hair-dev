import { BaseRequest, BaseResponse, BaseConf } from "../base"

export interface ReqGetPreview extends BaseRequest {}

export interface ResGetPreview extends BaseResponse {
  设计稿总数: number
  制帽总数: number
  胶丝比例总数: number
  客户总数: number
}

export const conf: BaseConf = {}
