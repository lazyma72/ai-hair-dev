// import { ApiCall, HttpServer, Logger } from "tsrpc"
// import { BaseConf, BaseRequest, BaseResponse } from "../shared/protocols/base"
// import { ServiceType } from "../shared/protocols/serviceProto"

// // 添加一个固定的盐值常量
// const SALT = "your_secret_salt_here_!@#$%^&*"
// const SEPARATOR = "::"

// declare module "tsrpc" {
//   interface ApiCall {
//     currentUid: string
//   }
// }

// export function useUserToken(server: HttpServer<ServiceType>) {
//   // 解析登录态
//   // 如果 conf.needLogin，则登录态必须，如果没有就报错 NEED_LOGIN
//   server.flows.preApiCallFlow.push((call: ApiCall<BaseRequest, BaseResponse>) => {
//     let parsed: ReturnType<typeof parseUserToken> | undefined
//     try {
//       if (call.req.userToken) {
//         parsed = parseUserToken(call.req.userToken, call.logger)
//       }
//     } catch (e: any) {
//       call.logger.error("parse token error", e)
//     }

//     if (parsed) {
//       call.currentUid = parsed.userId
//       call.logger.prefixs.push(`[uid=${call.currentUid ?? "<undefined>"}]`)
//     }

//     if (!call.currentUid && !(call.service.conf as BaseConf)?.allowNoLogin) {
//       call.i18nError({
//         cn: "需要先登录",
//         en: "You need to login first",
//       })
//       return undefined
//     }

//     return call
//   })
// }

// export function makeUserToken(userId: string, logger: Logger): string {
//   // 1. 加入时间戳，使每次生成的 token 都不同
//   const timestamp = Date.now().toString()

//   // 2. 组合数据：userId + 时间戳 + 盐
//   const dataToEncode = `${userId}${SEPARATOR}${timestamp}${SEPARATOR}${SALT}`

//   // 3. 进行简单的混淆和 base64 编码
//   const mixed = dataToEncode
//     .split("")
//     .map((char, index) => {
//       // 使用字符的 ASCII 码和位置进行简单混淆
//       return String.fromCharCode(char.charCodeAt(0) ^ index % 8)
//     })
//     .join("")

//   return Buffer.from(mixed).toString("base64")
// }

// export function parseUserToken(userToken: string, logger: Logger): { userId: string } {
//   // 1. 解码 base64
//   const decoded = Buffer.from(userToken, "base64").toString()

//   // 2. 还原混淆
//   const unmixed = decoded
//     .split("")
//     .map((char, index) => {
//       return String.fromCharCode(char.charCodeAt(0) ^ index % 8)
//     })
//     .join("")

//   // 3. 分离数据
//   const [userId, timestamp, salt] = unmixed.split(SEPARATOR)

//   // 4. 验证盐值
//   if (salt !== SALT) {
//     throw new Error("Invalid token")
//   }

//   // 5. 可以选择验证时间戳是否过期
//   const tokenTime = parseInt(timestamp)
//   const now = Date.now()
//   // 例如设置 token 365天过期
//   if (now - tokenTime > 365 * 24 * 60 * 60 * 1000) {
//     throw new Error("Token expired")
//   }

//   return { userId }
// }
