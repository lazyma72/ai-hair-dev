import { BaseRequest, BaseResponse, BaseConf } from "./base";

export interface ReqUpload extends BaseRequest {
    /** 文件二进制内容 */
    fileData: Uint8Array;
    /** 原始文件名（含后缀），用于提取扩展名，如 "photo.jpg" */
    fileName: string;
    /** 存放子目录，如 "avatar"、"hair-draft" */
    dirName: string;
}

export interface ResUpload extends BaseResponse {
    /** 相对路径，格式：/upload/{dirName}/{uuid}.{ext} */
    path: string;
}

export const conf: BaseConf = {
    allowNoLogin: false
}
