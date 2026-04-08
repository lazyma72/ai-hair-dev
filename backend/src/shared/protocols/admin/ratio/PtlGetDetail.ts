import { BaseRequest, BaseResponse, BaseConf } from "../../base"
import { 胶丝比例Frontend } from "../../../frontend/model/model"

export interface ReqGetDetail extends BaseRequest {
  id: string
}

export interface ResGetDetail extends BaseResponse {
  胶丝比例: 胶丝比例Frontend
}

export const conf: BaseConf = {
  allowNoLogin: true,
}
