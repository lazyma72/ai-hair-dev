import { BaseRequest, BaseResponse, BaseConf } from "./base"
/** 转换 CDR 文件为 SVG  */
export interface ReqCdrToSvg extends BaseRequest {
  /** 文件二进制内容 */
  fileData: Uint8Array
  /** 原始文件名（含后缀），用于提取扩展名，如 "photo.jpg" */
  fileName: string
  /** 存放子目录，如 "avatar"、"hair-draft" */
  dirName: string
}

export interface ResCdrToSvg extends BaseResponse {
  svg: string
}

export const conf: BaseConf = {}
