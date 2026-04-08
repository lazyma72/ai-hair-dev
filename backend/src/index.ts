import dotenv from "dotenv"
import "k8w-extend-native"
import path from "path"
import { HttpServer } from "tsrpc"
import { Global } from "./models/Global"
import { serviceProto } from "./shared/protocols/serviceProto"
import { backConfig } from "./models/backConfig"

async function main() {
  const server = new HttpServer(serviceProto, {
    port: 3000,
    json: true,
    logLevel: "debug",
    logReqBody: false,
    logResBody: false,
    // ...(backConfig.logInOneLine ? { logger: getOnelineLogger(true) } : undefined),
    cors: "*",
    returnInnerError: true,
    apiTimeout: 100000,
  })
  server.autoImplementApi(path.resolve(__dirname, "api"))

  await Global.init()

  await server.start()

  // setInterval(() => {
  //   let used = process.memoryUsage().heapUsed / 1024 / 1024;
  //   logger.log(`内存: ${Math.round(used * 100) / 100} MB`);
  // }, 2000);
}

// 启动入口
main().catch(e => {
  console.error("服务启动失败:", e)
  process.exit(1)
})
