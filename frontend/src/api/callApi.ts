/**
 * callApi — tsrpc 的薄封装，内部创建独立的 HttpClient。
 *
 * 用法：
 *   import { callApi } from "../api/callApi"
 *   const result = await callApi("file/GetList", {})
 *   if (result.isSucc) { ... result.res.list }
 */
import { HttpClient } from "tsrpc-browser";
import { serviceProto } from "../shared/protocols/serviceProto";
import type { ServiceType } from "../shared/protocols/serviceProto";

// In dev Vite proxies /api → http://localhost:3000; in prod set VITE_API_BASE.
const apiBase =
  (import.meta as { env?: { VITE_API_BASE?: string } }).env?.VITE_API_BASE ??
  "/api/";

const client = new HttpClient(serviceProto, {
  server: apiBase,
  json: true,
});

export type ApiName = keyof ServiceType["api"];

export async function callApi<K extends ApiName>(
  apiName: K,
  req: ServiceType["api"][K]["req"],
): Promise<
  | { isSucc: true; res: ServiceType["api"][K]["res"] }
  | { isSucc: false; err: { message: string } }
> {
  const result = await client.callApi(apiName, req as never);
  if (result.isSucc) {
    return { isSucc: true, res: result.res };
  }
  return { isSucc: false, err: { message: result.err?.message ?? "请求失败" } };
}
