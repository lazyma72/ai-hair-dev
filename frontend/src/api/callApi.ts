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
import type { ReqCdrToSvg, ResCdrToSvg } from "../shared/protocols/PtlCdrToSvg";
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

let errorToastContainer: HTMLDivElement | null = null;

function ensureErrorToastContainer() {
  if (errorToastContainer) {
    return errorToastContainer;
  }
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "14px";
  container.style.left = "50%";
  container.style.transform = "translateX(-50%)";
  container.style.zIndex = "9999";
  container.style.width = "min(420px, calc(100vw - 32px))";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.gap = "8px";
  container.style.pointerEvents = "none";
  document.body.appendChild(container);
  errorToastContainer = container;
  return container;
}

function closeErrorToast(toast: HTMLDivElement, timerId?: number) {
  if (timerId !== undefined) {
    window.clearTimeout(timerId);
  }
  toast.remove();
  if (errorToastContainer && errorToastContainer.childElementCount === 0) {
    errorToastContainer.remove();
    errorToastContainer = null;
  }
}

function showApiErrorModal(errorMessage: string) {
  if (typeof document === "undefined") {
    window.alert(errorMessage);
    return;
  }

  const container = ensureErrorToastContainer();

  const mask = document.createElement("div");
  mask.setAttribute("role", "alert");
  mask.setAttribute("aria-live", "assertive");
  mask.style.width = "100%";
  mask.style.pointerEvents = "auto";

  const dialog = document.createElement("div");
  dialog.style.display = "flex";
  dialog.style.alignItems = "center";
  dialog.style.gap = "8px";
  dialog.style.width = "100%";
  dialog.style.minHeight = "40px";
  dialog.style.borderRadius = "8px";
  dialog.style.background = "#ffffff";
  dialog.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.12)";
  dialog.style.padding = "8px 12px";
  dialog.style.color = "#262626";
  dialog.style.cursor = "pointer";

  const icon = document.createElement("div");
  icon.textContent = "!";
  icon.style.display = "inline-flex";
  icon.style.alignItems = "center";
  icon.style.justifyContent = "center";
  icon.style.width = "14px";
  icon.style.height = "14px";
  icon.style.flex = "0 0 14px";
  icon.style.borderRadius = "9999px";
  icon.style.background = "#ff4d4f";
  icon.style.color = "#ffffff";
  icon.style.fontSize = "10px";
  icon.style.fontWeight = "700";
  icon.style.lineHeight = "1";

  const content = document.createElement("div");
  content.style.flex = "1";
  content.textContent = errorMessage;
  content.style.fontSize = "14px";
  content.style.fontWeight = "400";
  content.style.lineHeight = "1.4";
  content.style.wordBreak = "break-word";
  dialog.append(icon, content);
  mask.appendChild(dialog);
  let timerId = 0;
  mask.onclick = () => closeErrorToast(mask, timerId);
  container.appendChild(mask);
  timerId = window.setTimeout(() => closeErrorToast(mask), 3200);
}

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
  const message = result.err?.message ?? "请求失败";
  const code = (result.err as { code?: string } | undefined)?.code;
  if (code !== "NEED_LOGIN") {
    showApiErrorModal(message);
  }
  return { isSucc: false, err: { message } };
}
