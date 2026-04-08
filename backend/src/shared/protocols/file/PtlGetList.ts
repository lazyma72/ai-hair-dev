import { BaseRequest, BaseResponse, BaseConf } from "../base"
import { 沐茵丝假发成品稿ListItem } from "../../frontend/model/model"

export interface ReqGetList extends BaseRequest {}

export interface ResGetList extends BaseResponse {
  list: 沐茵丝假发成品稿ListItem[]
}

export const conf: BaseConf = {
  allowNoLogin: true,
}
