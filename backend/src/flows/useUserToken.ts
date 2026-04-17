import crypto from "crypto"
import { ApiCall, HttpServer } from "tsrpc"
import { backConfig } from "../models/backConfig"
import { BaseConf, BaseRequest, BaseResponse } from "../shared/protocols/base"
import { ServiceType } from "../shared/protocols/serviceProto"

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000 // 1 天

/** 生成 token：base64url(payload).HMAC-SHA256 */
export function makeUserToken(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, exp: Date.now() + TOKEN_EXPIRY_MS })
  ).toString("base64url")
  const sig = crypto.createHmac("sha256", backConfig.jwtSecret).update(payload).digest("base64url")
  return `${payload}.${sig}`
}

/** 解析并验证 token，失败返回 undefined */
export function parseUserToken(token: string): { userId: string } | undefined {
  const dot = token.lastIndexOf(".")
  if (dot === -1) return undefined

  const payload = token.slice(0, dot)
  const sig = token.slice(dot + 1)

  const expected = crypto
    .createHmac("sha256", backConfig.jwtSecret)
    .update(payload)
    .digest("base64url")
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return undefined

  let parsed: { uid: string; exp: number }
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString())
  } catch {
    return undefined
  }

  if (Date.now() > parsed.exp) return undefined

  return { userId: parsed.uid }
}

/** 注册登录校验 flow：所有接口默认需要登录，除非 conf.allowNoLogin = true */
export function useUserToken(server: HttpServer<ServiceType>) {
  server.flows.preApiCallFlow.push((call: ApiCall<BaseRequest, BaseResponse>) => {
    const conf = call.service.conf as BaseConf | undefined

    if (conf?.allowNoLogin === true) return call

    const token = call.req.userToken
    const parsed = token ? parseUserToken(token) : undefined

    if (!parsed) {
      call.error("需要先登录", { code: "NEED_LOGIN" })
      return undefined
    }

    ;(call as any).currentUid = parsed.userId
    return call
  })
}
