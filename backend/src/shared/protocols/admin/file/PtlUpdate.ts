import { BaseRequest, BaseResponse, BaseConf } from "../../base";
import { 沐茵丝假发成品稿 } from "../../../db/Db沐茵丝假发成品稿";

export interface ReqUpdate extends BaseRequest {
  id: string
  file: 沐茵丝假发成品稿
}

export interface ResUpdate extends BaseResponse {
  id: string
}

export const conf: BaseConf = {
    
}
