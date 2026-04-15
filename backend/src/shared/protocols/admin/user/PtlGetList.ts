import { BaseConf, BaseRequest, BaseResponse } from "../../base"

export interface ReqGetList extends BaseRequest {
  keyword?: string
}

export interface UserListItem {
  _id: string
  name: string
  username: string
  role: "admin"
  createTime: string
  updateTime: string
}

export interface ResGetList extends BaseResponse {
  list: UserListItem[]
}

export const conf: BaseConf = {}
