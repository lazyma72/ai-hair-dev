import dotenv from "dotenv"
import "k8w-extend-native"
import path from "path"
import { HttpServer } from "tsrpc"
import { useUserToken } from "./flows/useUserToken"
import { Global } from "./models/Global"
import { serviceProto } from "./shared/protocols/serviceProto"

async function main() {
  const server = new HttpServer(serviceProto, {
    port: 3000,
    json: true,
    logLevel: "debug",
    logReqBody: false,
    logResBody: false,
    cors: "*",
    returnInnerError: true,
    apiTimeout: 100000,
  })
  server.autoImplementApi(path.resolve(__dirname, "api"))

  await Global.init()

  useUserToken(server)

  await server.start()
}

// 启动入口
main().catch(e => {
  console.error("服务启动失败:", e)
  process.exit(1)
})
