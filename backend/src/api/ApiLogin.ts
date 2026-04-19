import { ApiCall } from "tsrpc"
import { Global } from "../models/Global"
import { verifyPassword } from "../models/password"
import { makeUserToken } from "../flows/useUserToken"
import { ReqLogin, ResLogin } from "../shared/protocols/PtlLogin"

export default async function (call: ApiCall<ReqLogin, ResLogin>) {
  const { username, password } = call.req

  const userCol = Global.getCollection("用户")
  const user = await userCol.findOne({ username })

  if (!user || !(await verifyPassword(password, user.password))) {
    call.error("用户名或密码错误")
    return
  }

  const token = makeUserToken(user._id.toHexString())
  call.succ({ token, name: user.name, username: user.username })
}
