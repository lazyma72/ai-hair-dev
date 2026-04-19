import { BaseRequest, BaseResponse, BaseConf } from "./base"

export interface ReqLogin extends BaseRequest {
  username: string
  password: string
}

export interface ResLogin extends BaseResponse {
  token: string
  name: string
  username: string
}

export const conf: BaseConf = {
  allowNoLogin: true,
}
