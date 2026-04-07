import { BaseRequest, BaseResponse, BaseConf } from "../../base"
import { 胶丝比例ListItem } from "../../../frontend/model/model"

export interface ReqGetList extends BaseRequest {}

export interface ResGetList extends BaseResponse {
  list: 胶丝比例ListItem[]
}

export const conf: BaseConf = {
  allowNoLogin: true,
}
