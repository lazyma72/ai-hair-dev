import { BaseRequest, BaseResponse, BaseConf } from "./base";

export interface ReqMe extends BaseRequest {
    
}

export interface ResMe extends BaseResponse {
	name: string
	username: string
}

export const conf: BaseConf = {
    
}