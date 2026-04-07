export interface BaseRequest {
  userToken?: string
}

export interface BaseResponse {}

export interface BaseConf {
  /** 允许免登录访问 */
  allowNoLogin?: boolean
}
