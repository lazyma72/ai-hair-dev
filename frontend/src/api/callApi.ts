/**
 * callApi — tsrpc 的薄封装，内部创建独立的 HttpClient。
 *
 * 用法：
 *   import { callApi } from "../api/callApi"
 *   const result = await callApi("file/GetList", {})
 *   if (result.isSucc) { ... result.res.list }
 */
import { HttpClient } from "tsrpc-browser";
import { getApiBase } from "./apiBase";
import { serviceProto } from "../shared/protocols/serviceProto";
import type { ServiceType } from "../shared/protocols/serviceProto";
import type {
  ReqGenerateByAB,
  ResGenerateByAB,
} from "../shared/protocols/admin/file/PtlGenerateByAB";
import type {
  ReqCdrToSvg,
  ResCdrToSvg,
} from "../shared/protocols/PtlCdrToSvg";
import { getToken, clearToken } from "../auth";
import { frontConfig } from "../frontConfig";

const client = new HttpClient(serviceProto, {
  server: getApiBase(),
  json: true,
});

// 上传接口单独使用 prod 服务器
const uploadClient = new HttpClient(serviceProto, {
  server: frontConfig.prodServer,
  json: true,
});

function addFlows(c: HttpClient<ServiceType>) {
  c.flows.preCallApiFlow.push((v) => {
    const token = getToken();
    if (token) v.req.userToken = token;
    return v;
  });
  c.flows.preApiReturnFlow.push((v) => {
    if (
      !v.return.isSucc &&
      (v.return.err as { code?: string })?.code === "NEED_LOGIN"
    ) {
      clearToken();
      window.location.href = "#/login";
    }
    return v;
  });
}

addFlows(client);
addFlows(uploadClient);

export type ApiName = keyof ServiceType["api"];

export async function callApi(
  apiName: "admin/file/GenerateByAB",
  req: ReqGenerateByAB,
): Promise<
  | { isSucc: true; res: ResGenerateByAB }
  | { isSucc: false; err: { message: string } }
>;
export async function callApi(
  apiName: "CdrToSvg",
  req: ReqCdrToSvg,
): Promise<
  | { isSucc: true; res: ResCdrToSvg }
  | { isSucc: false; err: { message: string } }
>;
export async function callApi<K extends ApiName>(
  apiName: K,
  req: ServiceType["api"][K]["req"],
): Promise<
  | { isSucc: true; res: ServiceType["api"][K]["res"] }
  | { isSucc: false; err: { message: string } }
>;
export async function callApi(
  apiName: ApiName | "admin/file/GenerateByAB" | "CdrToSvg",
  req: any,
): Promise<
  { isSucc: true; res: any } | { isSucc: false; err: { message: string } }
> {
  const c = (apiName as string) === "Upload" ? uploadClient : client;
  const result = await c.callApi(apiName as any, req as never);
  if (result.isSucc) {
    return { isSucc: true, res: result.res };
  }
  return { isSucc: false, err: { message: result.err?.message ?? "请求失败" } };
}
