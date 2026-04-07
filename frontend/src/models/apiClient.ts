import { message } from "antd";
import { HttpClient } from "tsrpc-browser";
import { frontConfig, isDebug } from "../frontConfig";
import { serviceProto } from "../shared/protocols/serviceProto";

export const apiClient = new HttpClient(serviceProto, {
  server: frontConfig.apiServer,
  json: true,
  // logger
  [atob("bG9nZ2Vy")]: isDebug ? console : undefined,
});

// // 发送前加密
// apiClient.flows.preSendDataFlow.push(v => {
//   if (v.data instanceof Uint8Array) {
//     v.data = EncryptUtil.encrypt(v.data)
//   }
//   return v
// })
// // 接收前解密
// apiClient.flows.preRecvDataFlow.push(v => {
//   if (v.data instanceof Uint8Array) {
//     v.data = EncryptUtil.decrypt(v.data)
//   }
//   return v
// })

// // userToken
// apiClient.flows.preCallApiFlow.push((v) => {
//   // 检查当前路由是否是 ipad-diy，如果是使用写死的 token
//   const currentPath = window.location.hash;
//   const ipadDiyToken =
//     "Z3RncHBac3Rlczg5NTIwMzMwOzcyMD4zODs4emtwdFhzZGFxYXFZdGFtdlxsYHRiXyBCICAgWCEq";

//   if (currentPath.includes("#/ipad-diy")) {
//     v.req.userToken = ipadDiyToken;
//   } else {
//     v.req.userToken = Global.userToken || "";
//   }
//   return v;
// });

// apiClient.flows.preApiReturnFlow.push((v) => {
//   if (v.return.err?.code === "NEED_LOGIN") {
//     message.error(v.return.err.message);
//     Global.saveLoginRes(null);
//   }
//   return v;
// });

export function showError(err: { message?: string; type?: string }) {
  if (err.type === "NetworkError") {
    message.error("网络错误，请检查网络连接");
  } else {
    message.error(err.message ?? "服务器错误");
  }
}
